'use client'
import Header from '@/components/Header'

export default function CGUPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7f5' }}>
      <Header />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 5% 80px' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0f5233 0%, #1a7a4a 100%)', borderRadius: '16px', padding: '32px', marginBottom: '32px', color: 'white' }}>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: '8px' }}>
            Conditions d'utilisation
          </h1>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
            Dernière mise à jour : Mai 2026 · SokoDeal Rwanda
          </p>
        </div>

        {/* Navigation rapide */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e8ede9', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#111a14', marginBottom: '12px' }}>
            Table des matières
          </p>
          {[
            '1. Présentation de SokoDeal',
            '2. Inscription et compte utilisateur',
            '3. Publication d\'annonces',
            '4. Politique anti-arnaque',
            '5. Paiements et abonnements',
            '6. Responsabilités',
            '7. Mentions légales',
            '8. Contact',
          ].map((item, i) => (
            <a key={i} href={'#section-' + (i + 1)}
              style={{ display: 'block', padding: '6px 0', color: '#1a7a4a', fontSize: '0.85rem', textDecoration: 'none', borderBottom: '1px solid #f5f7f5' }}>
              {item}
            </a>
          ))}
        </div>

        {/* Sections */}
        {[
          {
            id: 1,
            title: '1. Présentation de SokoDeal',
            icon: '🦁',
            content: [
              'SokoDeal est une plateforme de petites annonces en ligne permettant aux particuliers et professionnels d\'acheter et vendre des biens et services au Rwanda et dans les pays voisins.',
              'En accédant à SokoDeal et en utilisant nos services, vous acceptez pleinement et sans réserve les présentes Conditions Générales d\'Utilisation (CGU).',
              'SokoDeal se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés des modifications importantes par email ou notification sur la plateforme.',
            ]
          },
          {
            id: 2,
            title: '2. Inscription et compte utilisateur',
            icon: '👤',
            content: [
              'L\'inscription sur SokoDeal nécessite la fourniture d\'informations exactes et véridiques, notamment votre nom complet, email, numéro de téléphone et une pièce d\'identité valide.',
              'Chaque utilisateur ne peut posséder qu\'un seul compte actif. La création de comptes multiples est interdite et peut entraîner la suspension de tous les comptes concernés.',
              'Vous êtes responsable de la confidentialité de vos identifiants de connexion. SokoDeal ne sera pas tenu responsable des dommages résultant de l\'utilisation non autorisée de votre compte.',
              'SokoDeal se réserve le droit de suspendre ou supprimer tout compte ne respectant pas ces conditions.',
            ]
          },
          {
            id: 3,
            title: '3. Publication d\'annonces',
            icon: '📋',
            content: [
              'Le plan gratuit permet de publier jusqu\'à 5 annonces actives simultanément. Des plans payants sont disponibles pour des besoins plus importants.',
              'Les annonces doivent être réelles, précises et correspondre exactement aux biens ou services proposés. Toute annonce trompeuse ou frauduleuse est strictement interdite.',
              'Il est interdit de publier des annonces pour : armes, drogues, produits contrefaits, contenus illégaux, services sexuels, animaux protégés, ou tout produit dont la vente est réglementée ou interdite au Rwanda.',
              'SokoDeal se réserve le droit de supprimer toute annonce sans préavis si elle ne respecte pas ces règles.',
              'Les photos publiées doivent correspondre au produit réel. L\'utilisation de photos volées ou trompeuses est interdite.',
            ]
          },
          {
            id: 4,
            title: '4. Politique anti-arnaque',
            icon: '⚠️',
            color: '#fffbeb',
            borderColor: '#fde68a',
            content: [
              '⚠️ IMPORTANT : SokoDeal est une plateforme de mise en relation. Nous ne sommes pas partie prenante des transactions entre acheteurs et vendeurs.',
              'SokoDeal ne rembourse pas les pertes financières liées à des arnaques ou fraudes entre utilisateurs. Nous vous conseillons vivement de suivre ces règles de sécurité :',
              '✓ Ne payez jamais à l\'avance sans avoir vu et vérifié l\'article en personne.',
              '✓ Rencontrez toujours le vendeur dans un lieu public et sécurisé.',
              '✓ Vérifiez l\'article soigneusement avant tout paiement.',
              '✓ Méfiez-vous des prix anormalement bas — si c\'est trop beau pour être vrai, c\'est probablement une arnaque.',
              '✓ Ne partagez jamais vos codes PIN MoMo ou informations bancaires.',
              '✓ En cas d\'arnaque, signalez l\'annonce immédiatement via le bouton "Signaler" et contactez la Police Nationale du Rwanda.',
              'En utilisant SokoDeal, vous reconnaissez avoir lu et compris cette politique anti-arnaque.',
            ]
          },
          {
            id: 5,
            title: '5. Paiements et abonnements',
            icon: '💳',
            content: [
              'SokoDeal propose des abonnements payants (Pro et Agence) et des boosts d\'annonces. Les paiements sont effectués via Mobile Money (MTN, Airtel).',
              'Les abonnements sont mensuels et se renouvellent automatiquement. Vous pouvez annuler à tout moment depuis votre espace profil.',
              'Les boosts sont des services ponctuels non remboursables une fois activés.',
              'SokoDeal se réserve le droit de modifier ses tarifs avec un préavis de 30 jours. Les abonnements en cours ne sont pas affectés jusqu\'à leur renouvellement.',
              'En cas de problème de paiement, contactez-nous à support@sokodeal.app',
            ]
          },
          {
            id: 6,
            title: '6. Responsabilités',
            icon: '⚖️',
            content: [
              'SokoDeal agit uniquement comme intermédiaire entre acheteurs et vendeurs. Nous ne garantissons pas la qualité, la sécurité ou la légalité des biens et services proposés.',
              'SokoDeal ne peut être tenu responsable des dommages directs ou indirects résultant de l\'utilisation de la plateforme, y compris les pertes financières liées à des transactions frauduleuses.',
              'L\'utilisateur est seul responsable du contenu qu\'il publie sur la plateforme et s\'engage à respecter les lois rwandaises en vigueur.',
              'SokoDeal se réserve le droit de coopérer avec les autorités judiciaires en cas d\'enquête sur des activités illicites.',
            ]
          },
          {
            id: 7,
            title: '7. Mentions légales',
            icon: '📄',
            content: [
              'SokoDeal est exploité par une entité enregistrée au Rwanda.',
              'La plateforme est hébergée sur des serveurs sécurisés. Les données personnelles sont traitées conformément à la loi rwandaise sur la protection des données.',
              'Vos données personnelles (nom, email, numéro de téléphone, document d\'identité) sont collectées pour vérifier votre identité et sécuriser la plateforme. Elles ne sont jamais vendues à des tiers.',
              'Vous avez le droit d\'accéder, modifier ou supprimer vos données personnelles en contactant support@sokodeal.app',
              'En cas de litige, les tribunaux rwandais sont compétents.',
            ]
          },
          {
            id: 8,
            title: '8. Contact',
            icon: '✉️',
            content: [
              'Pour toute question concernant ces conditions d\'utilisation, contactez-nous :',
              '📧 Email : support@sokodeal.app',
              '🌐 Site : www.sokodeal.app',
              '📍 Kigali, Rwanda',
              'Nous nous engageons à répondre à toutes les demandes dans un délai de 48 heures ouvrables.',
            ]
          },
        ].map((section) => (
          <div key={section.id} id={'section-' + section.id}
            style={{ background: (section as any).color || 'white', borderRadius: '14px', padding: '24px', border: '1px solid ' + ((section as any).borderColor || '#e8ede9'), marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#111a14', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{section.icon}</span> {section.title}
            </h2>
            {section.content.map((para, i) => (
              <p key={i} style={{ color: '#444', fontSize: '0.88rem', lineHeight: 1.8, marginBottom: '10px' }}>
                {para}
              </p>
            ))}
          </div>
        ))}

        {/* Footer CGU */}
        <div style={{ background: '#0f5233', borderRadius: '14px', padding: '24px', textAlign: 'center', color: 'white' }}>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>
            En utilisant SokoDeal, vous acceptez ces conditions.
          </p>
          <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '16px' }}>
            © 2026 SokoDeal · Made in Africa 🌍
          </p>
          <button onClick={() => window.location.href = '/'}
            style={{ padding: '10px 24px', background: '#f5a623', border: 'none', borderRadius: '9px', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#111a14', cursor: 'pointer' }}>
            Retour à l'accueil
          </button>
        </div>

      </div>
    </div>
  )
}