import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de uso — Imovil',
  description: 'Termos de uso da plataforma Imovil.',
}

const LAST_UPDATED = '2026-05-07'
const CONTACT_EMAIL = 'contato@cbrl.dev'

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
        Termos de uso
      </h1>
      <p className="text-muted-foreground mt-4 text-sm">Última atualização: {LAST_UPDATED}</p>

      <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none">
        <h2>1. Aceitação</h2>
        <p>
          Ao acessar o Imovil você concorda com estes termos. Se discordar de qualquer parte, não
          use o serviço.
        </p>

        <h2>2. Sobre o serviço</h2>
        <p>
          Imovil é uma plataforma para corretores de imóveis (brokers) publicarem anúncios.
          Visitantes podem navegar pelo catálogo público sem conta. Brokers precisam autenticar via
          Google para publicar.
        </p>

        <h2>3. Conta e responsabilidades do broker</h2>
        <ul>
          <li>
            Você é responsável por manter os dados de contato (telefone, CRECI) atualizados e
            verdadeiros.
          </li>
          <li>
            Você é responsável pelo conteúdo dos anúncios — fotos que sobe e descrição que escreve
            devem ser verdadeiros e ter os direitos necessários (foto do imóvel, autorização do
            proprietário).
          </li>
          <li>Suspendemos contas que publiquem conteúdo enganoso, ilegal ou abusivo.</li>
        </ul>

        <h2>4. Conduta proibida</h2>
        <ul>
          <li>Anunciar imóveis que você não tem autorização para anunciar;</li>
          <li>Subir fotos com direitos de terceiros sem permissão;</li>
          <li>Tentar abusar da plataforma (scraping massivo, bypass de rate limits, injection);</li>
          <li>Publicar dados pessoais de terceiros sem consentimento.</li>
        </ul>

        <h2>5. Propriedade intelectual</h2>
        <p>
          O código, design e marca do Imovil são nossos. Conteúdo publicado pelos brokers (fotos,
          descrição) permanece do broker — concedem ao Imovil licença não-exclusiva para hospedar e
          exibir enquanto o anúncio estiver ativo.
        </p>

        <h2>6. Limitação de responsabilidade</h2>
        <p>
          Imovil é uma plataforma de anúncios. Não somos parte das negociações entre broker e
          interessado, não garantimos disponibilidade, preço ou condições do imóvel. Verifique
          informações diretamente com o broker.
        </p>

        <h2>7. Encerramento</h2>
        <p>
          Você pode encerrar sua conta a qualquer momento via menu &gt; Sair, e pedir eliminação dos
          dados via{' '}
          <a href="/privacidade" className="text-foreground underline">
            política de privacidade
          </a>
          . Podemos suspender contas que violarem estes termos.
        </p>

        <h2>8. Mudanças</h2>
        <p>
          Atualizações nestes termos são publicadas aqui com nova data de &quot;última
          atualização&quot;. Continuar usando o serviço após a mudança = concordar com a nova
          versão.
        </p>

        <h2>9. Foro e legislação</h2>
        <p>
          Estes termos são regidos pelas leis brasileiras. Foro da comarca de Manaus/AM, salvo
          quando lei do consumidor determinar foro do domicílio do consumidor.
        </p>

        <h2>10. Contato</h2>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline">
            {CONTACT_EMAIL}
          </a>
        </p>

        <h2>Histórico de versões</h2>
        <ul>
          <li>
            <strong>{LAST_UPDATED}</strong>: versão inicial.
          </li>
        </ul>
      </div>
    </main>
  )
}
