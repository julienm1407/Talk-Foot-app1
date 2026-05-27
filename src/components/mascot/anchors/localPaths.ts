/** Paths en coordonnées locales (+Y vers le bas depuis l’ancre). */

export function capPath(w: number, h: number, depth = 0.45): string {
  const hw = w / 2
  const hem = h * depth
  return `M ${-hw} ${hem}
    Q 0 ${-h * 0.12} ${hw} ${hem}
    Q 0 ${h * 0.62} ${-hw} ${hem} Z`
}

export function shallowCapPath(w: number, h: number): string {
  return capPath(w, h, 0.28)
}

export function wavyCapPath(w: number, h: number): string {
  const hw = w / 2
  return `M ${-hw + 2} ${h * 0.35}
    Q ${-hw - 2} ${-h * 0.05}, ${-hw * 0.35} ${-h * 0.08}
    Q 0 ${-h * 0.22}, ${hw * 0.35} ${-h * 0.08}
    Q ${hw + 2} ${-h * 0.05}, ${hw - 2} ${h * 0.35}
    Q ${hw * 0.4} ${h * 0.42}, 0 ${h * 0.38}
    Q ${-hw * 0.4} ${h * 0.42}, ${-hw + 2} ${h * 0.35} Z`
}

export function curlyCapPath(w: number, h: number): string {
  const bumps: string[] = []
  const n = 5
  for (let i = 0; i < n; i++) {
    const t = (i - (n - 1) / 2) / ((n - 1) / 2)
    const bx = t * (w * 0.38)
    const by = -h * 0.1
    const r = h * 0.22
    bumps.push(`M ${bx - r} ${by} a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 ${-r * 2} 0`)
  }
  return `${capPath(w, h, 0.32)} ${bumps.join(' ')}`
}

export function afroPath(w: number, h: number): string {
  const rx = w / 2 + 4
  const ry = h / 2 + 6
  return `M 0 ${-ry * 0.3} A ${rx} ${ry} 0 1 1 0 ${-ry * 0.3 + 0.01} Z`
}

export function mohawkPath(w: number, h: number): string {
  const hw = w * 0.12
  return `M ${-hw} ${h * 0.2}
    Q ${-hw * 0.6} ${-h * 0.85}, 0 ${-h}
    Q ${hw * 0.6} ${-h * 0.85}, ${hw} ${h * 0.2}
    Q 0 ${h * 0.05}, ${-hw} ${h * 0.2} Z`
}

export function sideLockPath(side: 'left' | 'right', w: number, h: number): string {
  const sign = side === 'left' ? -1 : 1
  const x0 = sign * (w * 0.08)
  return `M ${x0} ${0}
    Q ${sign * (w * 0.55)} ${h * 0.35}, ${sign * (w * 0.48)} ${h * 1.1}
    Q ${sign * (w * 0.2)} ${h * 0.95}, ${x0 + sign * 4} ${h * 0.25}
    Q ${sign * (w * 0.12)} ${h * 0.08}, ${x0} ${0} Z`
}

export function ponytailBackPath(w: number, h: number): string {
  return `M ${w * 0.08} ${0}
    Q ${w * 0.55} ${h * 0.15}, ${w * 0.5} ${h * 0.85}
    Q ${w * 0.2} ${h * 0.9}, ${w * 0.05} ${h * 0.35}
    Q 0 ${h * 0.1}, ${w * 0.08} ${0} Z`
}

export function fadeSidePath(side: 'left' | 'right', w: number, h: number): string {
  const sign = side === 'left' ? -1 : 1
  return `M ${sign * w * 0.42} ${h * 0.15}
    Q ${sign * w * 0.5} ${h * 0.45}, ${sign * w * 0.38} ${h * 0.55}
    L ${sign * w * 0.32} ${h * 0.4}
    Q ${sign * w * 0.38} ${h * 0.2}, ${sign * w * 0.42} ${h * 0.15} Z`
}

export function moustachePath(w: number, h: number): string {
  const hw = w / 2
  return `M ${-hw} ${h * 0.35}
    Q ${-hw * 0.5} ${0}, 0 ${h * 0.08}
    Q ${hw * 0.5} ${0}, ${hw} ${h * 0.35}
    Q ${hw * 0.45} ${h * 0.55}, 0 ${h * 0.5}
    Q ${-hw * 0.45} ${h * 0.55}, ${-hw} ${h * 0.35} Z`
}

export function goateePath(w: number, h: number): string {
  const hw = w * 0.35
  return `M ${-hw} ${0}
    Q 0 ${h * 0.9}, ${hw} ${0}
    Q 0 ${h * 0.35}, ${-hw} ${0} Z`
}

export function fullBeardPath(w: number, h: number): string {
  const hw = w / 2
  return `M ${-hw} ${h * 0.08}
    Q ${-hw * 1.05} ${h * 0.55}, ${-hw * 0.35} ${h * 0.85}
    Q 0 ${h}, ${hw * 0.35} ${h * 0.85}
    Q ${hw * 1.05} ${h * 0.55}, ${hw} ${h * 0.08}
    Q 0 ${h * 0.42}, ${-hw} ${h * 0.08} Z`
}

export function jawLinePath(w: number, h: number): string {
  const hw = w / 2
  return `M ${-hw} ${h * 0.15} Q 0 ${h * 0.7} ${hw} ${h * 0.15}`
}
