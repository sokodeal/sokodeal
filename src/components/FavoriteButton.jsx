// components/FavoriteButton.jsx
import { useState } from 'react'
import { useFavorites } from '../hooks/useFavorites'

/**
 * Bouton cœur favori à placer sur chaque carte d'annonce.
 *
 * Props:
 *   adId      (string, requis)   — UUID de l'annonce
 *   onLogin   (function, optionnel) — callback si user non connecté (ex: ouvrir modal login)
 *   size      ('sm' | 'md' | 'lg') — taille du bouton (défaut: 'md')
 *   className (string, optionnel) — classes CSS supplémentaires
 *
 * Exemple:
 *   <FavoriteButton adId={ad.id} onLogin={() => setShowLoginModal(true)} />
 */
export default function FavoriteButton({ adId, onLogin, size = 'md', className = '' }) {
  const { isFavorite, toggleFavorite, userId } = useFavorites()
  const [pending, setPending] = useState(false)

  const active = isFavorite(adId)

  const sizeClasses = {
    sm: 'w-7 h-7 text-base',
    md: 'w-9 h-9 text-lg',
    lg: 'w-11 h-11 text-xl',
  }

  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation() // évite de déclencher le lien de la carte

    if (!userId) {
      onLogin?.()
      return
    }

    setPending(true)
    await toggleFavorite(adId)
    setPending(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      title={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={[
        'favorite-btn',
        sizeClasses[size] || sizeClasses.md,
        active ? 'active' : '',
        pending ? 'pending' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="favorite-icon"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}

/* ─── CSS à ajouter dans ton fichier global (ex: globals.css) ───────────────

.favorite-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  cursor: pointer;
  transition: transform 0.15s ease, background 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 6px rgba(0,0,0,0.12);
  color: #9ca3af;        /* gris par défaut */
  flex-shrink: 0;
}

.favorite-btn:hover {
  transform: scale(1.12);
  box-shadow: 0 3px 12px rgba(0,0,0,0.18);
  color: #ef4444;
}

.favorite-btn.active {
  color: #ef4444;
  background: #fff1f2;
}

.favorite-btn.pending {
  opacity: 0.6;
  pointer-events: none;
}

.favorite-icon {
  width: 55%;
  height: 55%;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.favorite-btn:not(.pending):active .favorite-icon {
  transform: scale(1.35);
}

──────────────────────────────────────────────────────────────────────────── */
