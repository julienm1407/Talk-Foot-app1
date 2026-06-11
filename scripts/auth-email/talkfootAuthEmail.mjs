/** Templates HTML auth Talk Foot — compatibles clients mail (tables + styles inline). */

export const TALKFOOT_SITE_URL =
  (process.env.VITE_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://talk-foot.com')
    .trim()
    .replace(/\/$/, '')

export const TALKFOOT_CONTACT_EMAIL =
  process.env.VITE_LEGAL_CONTACT_EMAIL?.trim() || 'app.talkfoot@gmail.com'

export const TALKFOOT_LOGO_URL = `${TALKFOOT_SITE_URL}/logo-talk-foot.png`

/**
 * @param {{
 *   title: string
 *   intro: string
 *   ctaLabel: string
 *   actionUrl: string
 *   secondaryNote?: string
 *   preheader?: string
 * }} opts
 */
export function buildTalkFootAuthEmailHtml(opts) {
  const preheader = opts.preheader ?? opts.intro.slice(0, 120)
  const secondary = opts.secondaryNote ?? `Besoin d'aide ? ${TALKFOOT_CONTACT_EMAIL}`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#041424;font-family:Manrope,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(180deg,#041424 0%,#061a2e 100%);padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <img src="${TALKFOOT_LOGO_URL}" alt="Talk Foot" width="72" height="72" style="display:block;border-radius:16px;border:2px solid rgba(255,255,255,0.18);background:#ffffff;" />
            </td>
          </tr>
          <tr>
            <td style="background:#0a223a;border:1px solid rgba(125,211,252,0.22);border-radius:20px;padding:28px 24px 24px;box-shadow:0 18px 48px rgba(0,8,22,0.35);">
              <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#7dd3fc;">Talk Foot</p>
              <h1 style="margin:0 0 14px;font-size:26px;line-height:1.15;font-weight:900;color:#f8fafc;">${escapeHtml(opts.title)}</h1>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.55;font-weight:600;color:#cbd5e1;">${escapeHtml(opts.intro)}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;">
                <tr>
                  <td align="center" style="border-radius:14px;background:#ff3b3b;">
                    <a href="${opts.actionUrl}" target="_blank" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:14px;">${escapeHtml(opts.ctaLabel)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;font-weight:600;color:#94a3b8;">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :</p>
              <p style="margin:0 0 18px;font-size:12px;line-height:1.5;word-break:break-all;">
                <a href="${opts.actionUrl}" target="_blank" style="color:#38bdf8;text-decoration:underline;">${opts.actionUrl}</a>
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;font-weight:600;color:#64748b;">${escapeHtml(secondary)}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 8px 0;font-size:11px;line-height:1.5;font-weight:600;color:#64748b;">
              © Talk Foot — La communauté foot en direct<br />
              <a href="${TALKFOOT_SITE_URL}" style="color:#7dd3fc;text-decoration:none;">${TALKFOOT_SITE_URL.replace(/^https?:\/\//, '')}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function supabaseAuthEmailTemplates() {
  const signupIntro =
    'Tu es à un clic de rejoindre la tribune Talk Foot. Active ton compte pour accéder aux salons, paris et débats entre supporters.'
  const recoveryIntro =
    'Nous avons reçu une demande de réinitialisation de ton mot de passe Talk Foot. Si tu es à l’origine de cette demande, clique ci-dessous.'
  const magicIntro =
    'Voici ton lien de connexion Talk Foot. Il est valable une courte durée et ne peut être utilisé qu’une fois.'
  const inviteIntro =
    'Tu as été invité à rejoindre Talk Foot. Accepte l’invitation pour créer ton compte supporter.'

  return {
    mailer_subjects_confirmation: 'Talk Foot — Confirme ton inscription ⚽',
    mailer_templates_confirmation_content: buildTalkFootAuthEmailHtml({
      title: 'Bienvenue dans la tribune !',
      intro: signupIntro,
      ctaLabel: 'Activer mon compte',
      actionUrl: '{{ .ConfirmationURL }}',
      secondaryNote: 'Tu n’as pas créé de compte ? Ignore simplement cet email.',
      preheader: 'Confirme ton adresse email pour activer ton compte Talk Foot.',
    }),
    mailer_subjects_recovery: 'Talk Foot — Réinitialise ton mot de passe',
    mailer_templates_recovery_content: buildTalkFootAuthEmailHtml({
      title: 'Nouveau mot de passe',
      intro: recoveryIntro,
      ctaLabel: 'Choisir un mot de passe',
      actionUrl: '{{ .ConfirmationURL }}',
      secondaryNote: 'Tu n’as rien demandé ? Ignore cet email, ton mot de passe reste inchangé.',
      preheader: 'Réinitialise ton mot de passe Talk Foot.',
    }),
    mailer_subjects_magic_link: 'Talk Foot — Ton lien de connexion',
    mailer_templates_magic_link_content: buildTalkFootAuthEmailHtml({
      title: 'Connexion Talk Foot',
      intro: magicIntro,
      ctaLabel: 'Me connecter',
      actionUrl: '{{ .ConfirmationURL }}',
      preheader: 'Lien de connexion Talk Foot (usage unique).',
    }),
    mailer_subjects_invite: 'Talk Foot — Tu es invité sur la tribune',
    mailer_templates_invite_content: buildTalkFootAuthEmailHtml({
      title: 'Invitation Talk Foot',
      intro: inviteIntro,
      ctaLabel: 'Accepter l’invitation',
      actionUrl: '{{ .ConfirmationURL }}',
      preheader: 'Rejoins Talk Foot via ton invitation.',
    }),
  }
}

export function clerkAuthEmailTemplate(slug) {
  const bySlug = {
    verification_link: {
      subject: 'Talk Foot — Confirme ton inscription ⚽',
      title: 'Bienvenue dans la tribune !',
      intro:
        'Tu es à un clic de rejoindre Talk Foot. Active ton compte pour accéder aux salons, paris et débats entre supporters.',
      ctaLabel: 'Activer mon compte',
    },
    email_link: {
      subject: 'Talk Foot — Confirme ton inscription ⚽',
      title: 'Bienvenue dans la tribune !',
      intro:
        'Tu es à un clic de rejoindre Talk Foot. Active ton compte pour accéder aux salons, paris et débats entre supporters.',
      ctaLabel: 'Activer mon compte',
    },
    magic_link: {
      subject: 'Talk Foot — Ton lien de connexion',
      title: 'Connexion Talk Foot',
      intro: 'Voici ton lien de connexion. Il est valable une courte durée et ne peut être utilisé qu’une fois.',
      ctaLabel: 'Me connecter',
    },
    reset_password: {
      subject: 'Talk Foot — Réinitialise ton mot de passe',
      title: 'Nouveau mot de passe',
      intro:
        'Nous avons reçu une demande de réinitialisation. Si tu es à l’origine de cette demande, clique ci-dessous.',
      ctaLabel: 'Choisir un mot de passe',
    },
    invitation: {
      subject: 'Talk Foot — Tu es invité sur la tribune',
      title: 'Invitation Talk Foot',
      intro: 'Tu as été invité à rejoindre Talk Foot. Accepte l’invitation pour créer ton compte supporter.',
      ctaLabel: 'Accepter l’invitation',
    },
  }

  const copy = bySlug[slug]
  if (!copy) return null

  const html = buildTalkFootAuthEmailHtml({
    ...copy,
    actionUrl: '{{action_url}}',
    secondaryNote:
      slug === 'reset_password'
        ? 'Tu n’as rien demandé ? Ignore cet email, ton mot de passe reste inchangé.'
        : 'Tu n’as pas créé de compte ? Ignore simplement cet email.',
  })

  return {
    subject: copy.subject,
    body: html,
    from_email_name: 'Talk Foot',
    reply_to_email_name: 'support',
    delivered_by_clerk: true,
  }
}

/** Slugs Clerk à personnaliser si présents sur l’instance. */
export const CLERK_AUTH_EMAIL_SLUGS = [
  'verification_link',
  'email_link',
  'magic_link',
  'reset_password',
  'invitation',
]
