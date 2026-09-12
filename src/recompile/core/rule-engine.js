// Generic cross-field consistency findings. Read-only by default.

export const Severity = Object.freeze({ INFO: 'INFO', WARN: 'WARN', CRITICAL: 'CRITICAL' });

export function finding({ id, severity = Severity.WARN, title, detail, target = null, evidence = {} }) {
  if (!id || !title) throw new Error('finding requires id and title');
  if (!Object.values(Severity).includes(severity)) throw new Error(`unsupported severity: ${severity}`);
  return Object.freeze({ id, severity, title, detail: detail || '', target, evidence });
}

export function runRules(rules, context) {
  const out = [];
  for (const rule of rules || []) {
    if (!rule || typeof rule.evaluate !== 'function') continue;
    try {
      const result = rule.evaluate(context);
      if (!result) continue;
      if (Array.isArray(result)) out.push(...result.filter(Boolean));
      else out.push(result);
    } catch (error) {
      out.push(finding({
        id: `rule-error:${rule.id || 'unknown'}`,
        severity: Severity.INFO,
        title: 'Consistency rule could not run',
        detail: error?.message || String(error),
        evidence: { ruleId: rule.id || null }
      }));
    }
  }
  return out;
}

export async function navigateFinding(target) {
  if (!target) return false;
  const root = document.querySelector('#form-composer') || document.body;
  let vm = null;
  try { vm = window.ko?.dataFor?.(root) || window.ko?.contextFor?.(root)?.$data; } catch {}

  // Prefer the application's own navigation hatches. Do not synthesize chart writes here.
  if (target.panel && typeof vm?.navigateToSpecifiedPanel === 'function') {
    try { await vm.navigateToSpecifiedPanel(target.panel); } catch {}
  }

  if (target.control && typeof vm?.clickSpecifiedControl === 'function') {
    try { vm.clickSpecifiedControl(target.control); return true; } catch {}
  }

  if (target.bindingPathEntryID) {
    const el = document.getElementById(target.bindingPathEntryID);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      try { el.focus?.({ preventScroll: true }); } catch {}
      return true;
    }
  }

  return false;
}

export const vascularRouteConsistencyRule = Object.freeze({
  id: 'vascular-route-consistency',
  evaluate(ctx) {
    const access = String(ctx?.vascularAccessRoute || '').toUpperCase();
    const medRoute = String(ctx?.medicationRoute || '').toUpperCase();
    if (!access || !medRoute) return null;

    const accessIsIO = /INTRAOSSEOUS|\bIO\b/.test(access);
    const accessIsIV = /INTRAVENOUS|\bIV\b/.test(access) && !accessIsIO;
    const medIsIO = /INTRAOSSEOUS|\bIO\b/.test(medRoute);
    const medIsIV = /INTRAVENOUS|\bIV\b/.test(medRoute) && !medIsIO;

    if ((accessIsIO && medIsIV) || (accessIsIV && medIsIO)) {
      return finding({
        id: 'route-mismatch:vascular-medication',
        severity: Severity.CRITICAL,
        title: 'Medication route conflicts with vascular access',
        detail: `Access is ${ctx.vascularAccessRoute}; medication route is ${ctx.medicationRoute}. Review before completion.`,
        target: ctx.medicationRouteTarget || ctx.vascularAccessTarget || null,
        evidence: { access: ctx.vascularAccessRoute, medicationRoute: ctx.medicationRoute }
      });
    }
    return null;
  }
});
