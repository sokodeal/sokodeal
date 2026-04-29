export default function CGUPage() {
  return (
    <div style={{minHeight:'100vh', background:'#f5f7f5'}}>

      <header style={{background:'white', borderBottom:'1px solid #e8ede9'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:'58px', maxWidth:'900px', margin:'0 auto'}}>
          <a href="/" style={{display:'flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
            <div style={{width:'32px', height:'32px', background:'#f5a623', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'#111a14'}}>Soko<span style={{color:'#1a7a4a'}}>Deal</span></span>
          </a>
          <a href="/" style={{fontSize:'0.82rem', color:'#6b7c6e', textDecoration:'none'}}>← Retour</a>
        </div>
      </header>

      <div style={{maxWidth:'900px', margin:'0 auto', padding:'40px 5%'}}>

        <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', color:'#111a14', marginBottom:'8px'}}>
          Conditions Generales d Utilisation
        </h1>
        <p style={{color:'#6b7c6e', fontSize:'0.85rem', marginBottom:'40px'}}>Derniere mise a jour : Avril 2025</p>

        {[
          {
            title:'1. Presentation de SokoDeal',
            content:`SokoDeal est une plateforme de petites annonces en ligne permettant aux particuliers et professionnels de publier, consulter et repondre a des annonces dans diverses categories (immobilier, vehicules, electronique, emploi, etc.) principalement au Rwanda et en Afrique.

La plateforme est editee et exploitee par SokoDeal, accessible a l adresse sokodeal.app.`
          },
          {
            title:'2. Acceptation des conditions',
            content:`En accedant et en utilisant la plateforme SokoDeal, vous acceptez sans reserve les presentes Conditions Generales d Utilisation. Si vous n acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.

SokoDeal se reserve le droit de modifier ces conditions a tout moment. Les modifications prennent effet des leur publication sur la plateforme.`
          },
          {
            title:'3. Creation de compte',
            content:`Pour publier des annonces, vous devez creer un compte en fournissant des informations exactes et a jour. Vous etes responsable de la confidentialite de vos identifiants de connexion.

Vous devez etre age d au moins 18 ans pour creer un compte et utiliser les services de SokoDeal. Une verification d identite peut etre requise pour certaines fonctionnalites.`
          },
          {
            title:'4. Publication d annonces',
            content:`Les annonces publiees sur SokoDeal doivent respecter les regles suivantes :
- Les informations doivent etre exactes, completes et non trompeuses
- Les photos doivent correspondre au bien ou service propose
- Le prix doit etre indique en RWF (Franc Rwandais)
- Les annonces ne doivent pas contenir de contenu illegal, offensant ou trompeur
- Chaque annonce doit correspondre a un bien ou service reel disponible a la vente

SokoDeal se reserve le droit de supprimer toute annonce qui ne respecte pas ces regles, sans preavis ni remboursement.`
          },
          {
            title:'5. Contenus interdits',
            content:`Il est strictement interdit de publier des annonces concernant :
- Des armes, munitions ou explosifs
- Des substances illegales ou drogues
- Des animaux proteges ou en voie de disparition
- Des documents officiels falsifies
- Tout contenu a caractere pornographique, violent ou discriminatoire
- Des produits contrefaits ou voles
- Des services illegaux

Toute violation de ces regles peut entrainer la suppression immediate du compte et le signalement aux autorites competentes.`
          },
          {
            title:'6. Boosts et services payants',
            content:`SokoDeal propose des services payants permettant de mettre en avant vos annonces (Boosts). Ces services sont factures selon les tarifs en vigueur sur la plateforme.

Les paiements sont securises et non remboursables une fois le service active. SokoDeal se reserve le droit de modifier ses tarifs a tout moment avec un preavis raisonnable.`
          },
          {
            title:'7. Responsabilite',
            content:`SokoDeal agit en tant qu intermediaire et n est pas partie aux transactions entre vendeurs et acheteurs. La plateforme ne peut etre tenue responsable de :
- La qualite, la conformite ou la disponibilite des biens ou services proposes
- Les litiges entre utilisateurs
- Les pertes ou dommages resultant d une transaction

Nous recommandons vivement de rencontrer le vendeur dans un lieu public et de verifier tout article avant paiement.`
          },
          {
            title:'8. Protection des donnees personnelles',
            content:`SokoDeal collecte et traite vos donnees personnelles conformement a la legislation en vigueur sur la protection des donnees. Vos donnees sont utilisees uniquement pour :
- La gestion de votre compte
- La publication et la gestion de vos annonces
- L amelioration de nos services
- La communication relative a votre compte

Vous disposez d un droit d acces, de rectification et de suppression de vos donnees personnelles en nous contactant a privacy@sokodeal.app.`
          },
          {
            title:'9. Propriete intellectuelle',
            content:`Tout le contenu de la plateforme SokoDeal (logo, design, textes, fonctionnalites) est protege par les droits de propriete intellectuelle et appartient a SokoDeal ou a ses partenaires.

En publiant du contenu sur SokoDeal, vous accordez a la plateforme une licence non exclusive d utilisation de ce contenu dans le cadre du service.`
          },
          {
            title:'10. Droit applicable',
            content:`Les presentes CGU sont soumises au droit rwandais. Tout litige relatif a l utilisation de la plateforme sera soumis a la juridiction competente de Kigali, Rwanda.

Pour toute question concernant ces conditions, contactez-nous a legal@sokodeal.app.`
          },
        ].map((section, i) => (
          <div key={i} style={{background:'white', borderRadius:'14px', padding:'24px', border:'1px solid #e8ede9', marginBottom:'12px'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1rem', color:'#111a14', marginBottom:'12px'}}>
              {section.title}
            </h2>
            <p style={{color:'#444', fontSize:'0.88rem', lineHeight:1.8, whiteSpace:'pre-line'}}>
              {section.content}
            </p>
          </div>
        ))}

        <div style={{background:'#f0f9f4', borderRadius:'14px', padding:'24px', border:'1px solid #b7dfca', marginTop:'20px'}}>
          <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1rem', color:'#0f5233', marginBottom:'12px'}}>
            📬 Mentions legales
          </h2>
          <div style={{color:'#333', fontSize:'0.88rem', lineHeight:2}}>
            <div><strong>Editeur :</strong> SokoDeal</div>
            <div><strong>Site web :</strong> sokodeal.app</div>
            <div><strong>Email :</strong> contact@sokodeal.app</div>
            <div><strong>Siege social :</strong> Kigali, Rwanda</div>
            <div><strong>Hebergeur :</strong> Netlify, Inc. — 44 Montgomery Street, Suite 300, San Francisco, CA 94104, USA</div>
            <div><strong>Base de donnees :</strong> Supabase — Hosted on AWS</div>
          </div>
        </div>

      </div>

      <footer style={{background:'#0f5233', color:'rgba(255,255,255,0.6)', padding:'28px 5%', marginTop:'40px'}}>
        <div style={{maxWidth:'900px', margin:'0 auto', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', alignItems:'center'}}>
          <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'white'}}>
            Soko<span style={{color:'#f5a623'}}>Deal</span>
          </div>
          <span style={{fontSize:'0.78rem'}}>© 2025 SokoDeal · Made in Africa 🌍</span>
        </div>
      </footer>
    </div>
  )
}