export default function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://nexocollege.com.br/#website',
        url: 'https://nexocollege.com.br',
        name: 'NexoCollege',
        description: 'Plataforma simples para criar escolas online',
        inLanguage: 'pt-BR',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://nexocollege.com.br/cadastro',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://nexocollege.com.br/#organization',
        name: 'NexoCollege',
        url: 'https://nexocollege.com.br',
        logo: {
          '@type': 'ImageObject',
          url: 'https://nexocollege.com.br/logo.png',
          width: 200,
          height: 60,
        },
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'contato@nexocollege.com.br',
          contactType: 'customer service',
          availableLanguage: 'Portuguese',
        },
        sameAs: [],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://nexocollege.com.br/#software',
        name: 'NexoCollege',
        applicationCategory: 'EducationApplication',
        operatingSystem: 'Web',
        description: 'Plataforma SaaS brasileira para criação e gestão de escolas online com cursos, certificados e pagamentos integrados.',
        url: 'https://nexocollege.com.br',
        offers: [
          {
            '@type': 'Offer',
            name: 'Starter',
            price: '0',
            priceCurrency: 'BRL',
            description: 'Plano gratuito com 1 curso e até 30 alunos',
          },
          {
            '@type': 'Offer',
            name: 'Creator',
            price: '697',
            priceCurrency: 'BRL',
            description: 'Plano Creator com 5 cursos e até 300 alunos',
          },
          {
            '@type': 'Offer',
            name: 'Pro',
            price: '1597',
            priceCurrency: 'BRL',
            description: 'Plano Pro com 20 cursos e até 1000 alunos',
          },
        ],
        featureList: [
          'Criação de cursos online',
          'Gestão de alunos',
          'Certificados automáticos',
          'Pagamentos via Mercado Pago',
          'Vitrine personalizada',
          'Analytics gerencial',
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/<\//g, '<\\/') }}
    />
  )
}
