(() => {
  'use strict';

  const VERSION = '0.4.0-dev.1';
  if (window.GremlinA15Core04?.version) return;

  const now = () => new Date().toISOString();
  const clone = v => { try { return structuredClone(v); } catch { return JSON.parse(JSON.stringify(v)); } };
  const uid = prefix => `${prefix}-${crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

  const services = new Map();
  const workers = new Map();
  const jobs = new Map();
  const locks = new Map();
  const listeners = new Map();
  const queue = [];
  let pumping = false;

  const TERMINAL = new Set(['complete','blocked','error','canceled']);
  const DEFAULT_LIMITS = Object.freeze({ 'native-ai': 1, attachment: 1, 'chart-mutation': 1 });
  const resourceLimits = new Map(Object.entries(DEFAULT_LIMITS));

  function emit(type, detail = {}) {
    const event = Object.freeze({ id: uid('evt'), type, at: now(), runtimeVersion: VERSION, ...clone(detail) });
    for (const fn of listeners.get(type) || []) { try { fn(event); } catch {} }
    for (const fn of listeners.get('*') || []) { try { fn(event); } catch {} }
    try { window.dispatchEvent(new CustomEvent(`gremlin:a15:04:${type}`, { detail: event })); } catch {}
    return event;
  }

  function on(type, fn) {
    if (typeof fn !== 'function') throw new Error('listener must be a function');
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(fn);
    return () => listeners.get(type)?.delete(fn);
  }

  function registerService(id, service, meta = {}) {
    if (!id || !service) throw new Error('service id and implementation required');
    if (services.has(id)) throw new Error(`service already registered: ${id}`);
    services.set(id, { service, meta: clone(meta) });
    emit('service-registered', { serviceId: id, version: meta.version || null });
    return service;
  }

  function service(id, required = true) {
    const found = services.get(id)?.service;
    if (!found && required) throw new Error(`required service unavailable: ${id}`);
    return found || null;
  }

  function registerWorker(def) {
    if (!def?.id || typeof def.run !== 'function') throw new Error('worker requires id + run(job,ctx)');
    if (workers.has(def.id)) throw new Error(`worker already registered: ${def.id}`);
    workers.set(def.id, Object.freeze({
      id: def.id,
      version: String(def.version || '0.0.0'),
      resources: [...new Set(def.resources || [])],
      run: def.run,
      cancel: typeof def.cancel === 'function' ? def.cancel : null
    }));
    emit('worker-registered', { workerId: def.id, version: def.version || '0.0.0' });
  }

  function makeJob(spec) {
    if (!spec?.worker) throw new Error('job.worker required');
    if (!workers.has(spec.worker)) throw new Error(`unknown worker: ${spec.worker}`);
    const id = spec.id || uid('job');
    if (jobs.has(id)) throw new Error(`duplicate job: ${id}`);
    const worker = workers.get(spec.worker);
    const job = {
      id, worker: spec.worker, pipelineId: spec.pipelineId || null, itemId: spec.itemId || null,
      state: 'queued', priority: Number.isFinite(spec.priority) ? spec.priority : 50,
      dependsOn: [...new Set(spec.dependsOn || [])],
      resources: [...new Set([...(worker.resources || []), ...(spec.resources || [])])],
      payload: spec.payload ?? null, result: null, error: null,
      progress: 0, stage: spec.stage || null, createdAt: now(), startedAt: null, endedAt: null,
      abortController: new AbortController()
    };
    jobs.set(id, job); queue.push(id);
    emit('job-queued', publicJob(job));
    pump();
    return id;
  }

  function publicJob(j) {
    const { abortController, payload, ...safe } = j;
    return clone(safe);
  }

  function depsSatisfied(job) {
    for (const id of job.dependsOn) {
      const dep = jobs.get(id);
      if (!dep || dep.state !== 'complete') return false;
    }
    return true;
  }

  function canLock(resources) {
    return resources.every(r => (locks.get(r) || 0) < (resourceLimits.get(r) || 1));
  }
  function acquire(resources) { resources.forEach(r => locks.set(r, (locks.get(r) || 0) + 1)); }
  function release(resources) { resources.forEach(r => { const n=(locks.get(r)||1)-1; n ? locks.set(r,n) : locks.delete(r); }); }

  async function execute(job) {
    const worker = workers.get(job.worker);
    acquire(job.resources);
    job.state = 'running'; job.startedAt = now();
    emit('job-started', publicJob(job));
    const ctx = Object.freeze({
      runtime: api,
      signal: job.abortController.signal,
      service,
      progress(value, stage = job.stage) {
        job.progress = Math.max(0, Math.min(1, Number(value) || 0));
        job.stage = stage || null;
        emit('job-progress', publicJob(job));
      },
      checkpoint(data = {}) { emit('job-checkpoint', { jobId: job.id, itemId: job.itemId, data: clone(data) }); }
    });
    try {
      const result = await worker.run(job, ctx);
      if (job.abortController.signal.aborted) throw new DOMException('Canceled', 'AbortError');
      job.result = result ?? null; job.progress = 1; job.state = 'complete'; job.endedAt = now();
      emit('job-completed', publicJob(job));
    } catch (err) {
      job.error = String(err?.message || err); job.endedAt = now();
      job.state = err?.name === 'AbortError' ? 'canceled' : 'error';
      emit(job.state === 'canceled' ? 'job-canceled' : 'job-error', publicJob(job));
    } finally {
      release(job.resources); pump();
    }
  }

  async function pump() {
    if (pumping) return;
    pumping = true;
    try {
      queue.sort((a,b) => (jobs.get(a)?.priority ?? 50) - (jobs.get(b)?.priority ?? 50));
      let started;
      do {
        started = false;
        for (const id of [...queue]) {
          const job = jobs.get(id);
          if (!job || job.state !== 'queued') { queue.splice(queue.indexOf(id),1); continue; }
          if (job.dependsOn.some(d => ['error','blocked','canceled'].includes(jobs.get(d)?.state))) {
            job.state='blocked'; job.error='dependency-failed'; job.endedAt=now(); queue.splice(queue.indexOf(id),1); emit('job-blocked', publicJob(job)); continue;
          }
          if (!depsSatisfied(job) || !canLock(job.resources)) continue;
          queue.splice(queue.indexOf(id),1); started = true; execute(job);
        }
      } while (started);
    } finally { pumping = false; }
  }

  async function cancelJob(id) {
    const job = jobs.get(id); if (!job || TERMINAL.has(job.state)) return false;
    job.abortController.abort();
    if (job.state === 'queued') { job.state='canceled'; job.endedAt=now(); const i=queue.indexOf(id); if(i>=0)queue.splice(i,1); emit('job-canceled', publicJob(job)); }
    const worker=workers.get(job.worker); if(worker?.cancel) { try { await worker.cancel(job); } catch {} }
    pump(); return true;
  }

  function aggregate(pipelineId = null) {
    const set=[...jobs.values()].filter(j => !pipelineId || j.pipelineId===pipelineId);
    if (!set.length) return { progress:0, total:0, complete:0, running:0, blocked:0, error:0 };
    const progress=set.reduce((n,j)=>n+(j.progress||0),0)/set.length;
    return { progress, total:set.length, complete:set.filter(j=>j.state==='complete').length, running:set.filter(j=>j.state==='running').length, blocked:set.filter(j=>j.state==='blocked').length, error:set.filter(j=>j.state==='error').length };
  }

  const api = Object.freeze({
    version: VERSION,
    registerService, service,
    registerWorker,
    submit: makeJob,
    cancelJob,
    getJob: id => jobs.has(id) ? publicJob(jobs.get(id)) : null,
    listJobs: filter => [...jobs.values()].filter(j => !filter?.pipelineId || j.pipelineId===filter.pipelineId).map(publicJob),
    aggregate,
    on, emit,
    setResourceLimit(name, limit) { if (!name || !Number.isInteger(limit) || limit < 1) throw new Error('invalid resource limit'); resourceLimits.set(name,limit); pump(); },
    resources: () => ({ limits:Object.fromEntries(resourceLimits), active:Object.fromEntries(locks) })
  });

  Object.defineProperty(window, 'GremlinA15Core04', { value: api, configurable:false, writable:false });
  emit('runtime-ready', { version: VERSION });
})();
