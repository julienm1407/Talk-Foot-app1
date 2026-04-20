import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ProfilePhotoAvatar } from '../profile/ProfilePhotoAvatar'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import type { User } from '../../types/chat'
import { useProfile } from '../../hooks/useProfile'
import { MODERATION_REFUSED_MESSAGE_FR, containsBannedWord } from '../../utils/bannedWords'

const SPEAK_DURATION_MS = 8000

export function LiveCommentator({
  user,
  onCommentary,
  className,
  pipTargetRef,
}: {
  user: User
  onCommentary?: (text: string) => void
  className?: string
  pipTargetRef?: React.RefObject<HTMLDivElement | null>
}) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [moderationError, setModerationError] = useState<string | null>(null)
  const [liveCommentary, setLiveCommentary] = useState<{
    text: string
    expiresAt: number
  } | null>(null)
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pipVideoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  /** Cible portail : lu dans layout effect uniquement (pas pendant le render — React 19). */
  const [pipPortalHost, setPipPortalHost] = useState<HTMLDivElement | null>(null)

  const startSpeaking = useCallback(() => {
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current)
    setIsSpeaking(true)
    speakTimeoutRef.current = setTimeout(() => {
      setIsSpeaking(false)
      speakTimeoutRef.current = null
    }, SPEAK_DURATION_MS)
  }, [])

  const sendCommentary = useCallback(() => {
    const trimmed = commentText.trim()
    if (!trimmed) return
    if (containsBannedWord(trimmed)) {
      setModerationError(MODERATION_REFUSED_MESSAGE_FR)
      return
    }
    setModerationError(null)
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current)
    setLiveCommentary({
      text: trimmed,
      expiresAt: Date.now() + SPEAK_DURATION_MS,
    })
    onCommentary?.(trimmed)
    setCommentText('')
    setIsSpeaking(true)
    speakTimeoutRef.current = setTimeout(() => {
      setIsSpeaking(false)
      speakTimeoutRef.current = null
    }, SPEAK_DURATION_MS)
  }, [commentText, onCommentary])

  useEffect(
    () => () => {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    },
    [],
  )

  useEffect(() => {
    if (cameraOn) setIsMinimized(true)
  }, [cameraOn])

  useLayoutEffect(() => {
    if (!cameraOn) {
      setPipPortalHost(null)
      return
    }
    setPipPortalHost(pipTargetRef?.current ?? null)
  }, [cameraOn, pipTargetRef])

  useEffect(() => {
    if (!cameraOn) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      return
    }
    setCameraError(null)
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 24 } },
        audio: true,
      })
      .then((stream) => {
        streamRef.current = stream
        const video = pipVideoRef.current
        if (video && !video.srcObject) video.srcObject = stream
      })
      .catch((err) => {
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Caméra ou micro refusé'
            : err.name === 'NotFoundError'
              ? 'Caméra introuvable'
              : 'Impossible d\'accéder à la caméra',
        )
        setCameraOn(false)
      })
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [cameraOn])

  // Attribuer le stream au PIP vidéo une fois monté (évite les coupures)
  useEffect(() => {
    const video = pipVideoRef.current
    const stream = streamRef.current
    if (cameraOn && video && stream && video.srcObject !== stream) {
      video.srcObject = stream
    }
  }, [cameraOn])

  useEffect(() => {
    if (liveCommentary && Date.now() > liveCommentary.expiresAt) {
      setLiveCommentary(null)
    }
    const id = setInterval(() => {
      if (liveCommentary && Date.now() > liveCommentary.expiresAt) {
        setLiveCommentary(null)
      }
    }, 500)
    return () => clearInterval(id)
  }, [liveCommentary])

  const { profile } = useProfile()
  const commentatorProfileHref = user.id === 'me' ? '/profile' : `/user/${user.id}`

  if (!user.isAdmin) return null

  const Face = (
    props: { className?: string; size?: 'sm' | 'md' },
  ) => (
    <ProfilePhotoAvatar
      photoDataUrl={profile.profilePhotoDataUrl}
      seed={user.avatarSeed}
      accent={user.accent}
      alt={user.username}
      className={props.className ?? (props.size === 'sm' ? 'size-8' : 'size-10')}
    />
  )

  return (
    <>
      {/* PIP stream en haut à droite de la simulation match (portail) ou fallback */}
      {cameraOn &&
        (pipPortalHost
          ? createPortal(
              <div className="absolute right-0 top-0 z-30 w-max pointer-events-auto" style={{ contain: 'layout' }}>
                <div
                  className={cn(
                    'relative overflow-hidden rounded-xl border-2 bg-black shadow-2xl transition-all duration-300',
                    isSpeaking
                      ? 'border-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.5)] tf-pip-speak'
                      : 'border-rose-500/80',
                  )}
                >
                  <video
              ref={pipVideoRef}
              autoPlay
              playsInline
              muted
              style={{ display: 'block' }}
              className="h-[92px] w-[122px] object-cover sm:h-[120px] sm:w-[160px] md:h-[140px] md:w-[186px]"
            />
            <div className="absolute bottom-1 left-1 right-1 flex justify-end">
              <span
                className={cn(
                  'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-white',
                  isSpeaking ? 'bg-rose-600' : 'bg-black/60',
                )}
              >
                🎤
                {isSpeaking && <span className="text-[8px]">ON</span>}
              </span>
            </div>
          </div>
        </div>,
              pipPortalHost,
            )
          : (
        <div className="absolute top-3 right-3 z-30 sm:top-4 sm:right-4 pointer-events-auto" style={{ contain: 'layout' }}>
          <div
            className={cn(
              'relative overflow-hidden rounded-xl border-2 bg-black shadow-2xl transition-all duration-300',
              isSpeaking
                ? 'border-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.5)] tf-pip-speak'
                : 'border-rose-500/80',
            )}
          >
            <video
              ref={pipVideoRef}
              autoPlay
              playsInline
              muted
              style={{ display: 'block' }}
              className="h-[92px] w-[122px] object-cover sm:h-[120px] sm:w-[160px] md:h-[140px] md:w-[186px]"
            />
            <div className="absolute bottom-1 left-1 right-1 flex justify-end">
              <span
                className={cn(
                  'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-white',
                  isSpeaking ? 'bg-rose-600' : 'bg-black/60',
                )}
              >
                🎤
                {isSpeaking && <span className="text-[8px]">ON</span>}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Bandeau dans la colonne « Chat live », au-dessus du composer — flux document, pas de superposition */}
      <div
        className={cn(
          'w-full shrink-0 border-t border-rose-200/45 bg-gradient-to-b from-rose-50/70 via-white/92 to-tf-white/98',
          'px-2 py-1.5 sm:px-4 sm:py-2',
          className,
        )}
      >
        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-rose-800/70 sm:mb-1.5 sm:text-[10px]">
          Commentaire live
        </p>

        {liveCommentary && isSpeaking && (
          <div
            className="mb-1.5 animate-[tf-commentary-in_0.3s_ease-out] rounded-lg border border-rose-200/80 bg-white px-2.5 py-2 shadow-sm sm:mb-2 sm:rounded-xl sm:px-3 sm:py-2.5"
            aria-live="polite"
          >
            <div className="flex items-start gap-2.5">
              <Link
                to={commentatorProfileHref}
                className={cn('relative shrink-0 rounded-full outline-none', TF_FOCUS_VISIBLE)}
                aria-label={`Profil ${user.username}`}
              >
                <Face />
                <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
                </span>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={commentatorProfileHref}
                    className={cn('text-xs font-black text-slate-800 outline-none rounded-sm', TF_FOCUS_VISIBLE)}
                  >
                    {user.username}
                  </Link>
                  <span className="text-[10px] font-bold text-rose-600">LIVE</span>
                </div>
                <p className="mt-0.5 text-sm font-medium leading-relaxed text-slate-700">{liveCommentary.text}</p>
              </div>
              <div className="tf-sound-bars shrink-0 scale-90" aria-hidden>
                <span /><span /><span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {!isActive ? (
          <button
            type="button"
            onClick={() => setIsActive(true)}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/95 px-4 py-2.5 text-sm font-bold text-rose-800 shadow-sm transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 sm:justify-start',
            )}
            aria-label="Activer le mode commentaire"
          >
            <span className="text-lg">🎙️</span>
            <span>Ouvrir le panneau commentateur</span>
          </button>
        ) : cameraOn ? (
          /* Mode réduit quand le stream est lancé */
          <div
            className={cn(
              'rounded-2xl border border-tf-grey-pastel/50 bg-tf-white/95 shadow-sm backdrop-blur transition-all',
              isMinimized ? 'p-1.5' : 'p-2',
              'max-h-[min(52vh,360px)] overflow-y-auto',
            )}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsMinimized((m) => !m)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-xl font-bold text-tf-dark hover:bg-tf-grey-pastel/30',
                  isMinimized ? 'px-2 py-1 text-[11px]' : 'px-2 py-1.5 text-xs',
                )}
                aria-label={isMinimized ? 'Ouvrir les options' : 'Réduire'}
              >
                <span className="text-sm">🎙️</span>
                <span className="text-tf-grey">{isMinimized ? '▶' : '▼'}</span>
              </button>
              {!isMinimized ? (
                <Link
                  to={commentatorProfileHref}
                  className={cn(
                    'min-w-0 truncate font-bold text-tf-dark outline-none rounded-sm text-xs',
                    TF_FOCUS_VISIBLE,
                  )}
                >
                  {user.username}
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setIsActive(false)
                  setCameraOn(false)
                  setCameraError(null)
                }}
                className="rounded-lg p-1.5 text-tf-grey hover:bg-tf-grey-pastel/30 hover:text-tf-dark"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            {isMinimized ? null : (
              <div className="mt-2 space-y-2 border-t border-tf-grey-pastel/50 pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value)
                      setModerationError(null)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && sendCommentary()}
                    placeholder="Commentaire…"
                    className="flex-1 rounded-lg border border-tf-grey-pastel/50 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-rose-400/50"
                  />
                  <button
                    type="button"
                    onClick={sendCommentary}
                    disabled={!commentText.trim() || isSpeaking}
                    className="rounded-lg bg-rose-500 px-2 py-1.5 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-50"
                  >
                    Dire
                  </button>
                </div>
                {moderationError ? (
                  <p className="text-[10px] font-semibold text-rose-600">{moderationError}</p>
                ) : null}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={startSpeaking}
                    disabled={isSpeaking}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold',
                      isSpeaking ? 'border-rose-300 bg-rose-100 text-rose-800' : 'border-tf-grey-pastel/50 bg-tf-grey-pastel/20 text-tf-grey hover:bg-tf-grey-pastel/40',
                    )}
                  >
                    🎤 {isSpeaking ? 'ON' : 'Parler'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraOn(false)}
                    className="rounded-lg border border-rose-300 bg-rose-100 px-2 py-1.5 text-[11px] font-bold text-rose-800 hover:bg-rose-200"
                  >
                    📹 Off
                  </button>
                </div>
                {cameraError && <p className="text-[10px] font-semibold text-rose-600">{cameraError}</p>}
              </div>
            )}
          </div>
        ) : (
          <div className="max-h-[min(58vh,420px)] overflow-y-auto rounded-2xl border border-tf-grey-pastel/50 bg-tf-white/95 p-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 pb-2">
              <Link
                to={commentatorProfileHref}
                className={cn('shrink-0 rounded-full outline-none', TF_FOCUS_VISIBLE)}
                aria-label={`Profil ${user.username}`}
              >
                <Face size="sm" />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={commentatorProfileHref}
                    className={cn('text-xs font-black text-slate-800 outline-none rounded-sm', TF_FOCUS_VISIBLE)}
                  >
                    {user.username}
                  </Link>
                  {isSpeaking && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-600" />
                      </span>
                      EN DIRECT
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Commentateur</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsActive(false)
                  setCameraOn(false)
                  setCameraError(null)
                }}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value)
                    setModerationError(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && sendCommentary()}
                  placeholder="Ton commentaire en direct…"
                  className="flex-1 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400/50"
                />
                <button
                  type="button"
                  onClick={sendCommentary}
                  disabled={!commentText.trim() || isSpeaking}
                  className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500"
                >
                  Dire
                </button>
              </div>
              {moderationError ? (
                <p className="text-xs font-semibold text-rose-600">{moderationError}</p>
              ) : null}
              <button
                type="button"
                onClick={startSpeaking}
                disabled={isSpeaking}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition',
                  isSpeaking
                    ? 'border-rose-300 bg-rose-100 text-rose-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
                )}
              >
                <span className="text-lg">🎤</span>
                {isSpeaking ? (
                  <>
                    <span className="tf-sound-bars" aria-hidden>
                      <span /><span /><span /><span /><span />
                    </span>
                    <span>En cours…</span>
                  </>
                ) : (
                  'Parler (simulation)'
                )}
              </button>
              <button
                type="button"
                onClick={() => setCameraOn((o) => !o)}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition',
                  cameraOn
                    ? 'border-rose-300 bg-rose-100 text-rose-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
                )}
              >
                <span className="text-lg">{cameraOn ? '📹' : '📷'}</span>
                {cameraOn ? 'Éteindre la caméra' : 'Allumer la caméra'}
              </button>
              {cameraError && (
                <p className="text-xs font-semibold text-rose-600">{cameraError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
