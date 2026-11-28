import type { Metadata } from 'next'

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: 'Privacidade — Imovil',
  description: 'Política de privacidade do Imovil.',
}

const LAST_UPDATED = '2026-11-23'
const CONTACT_EMAIL = 'privacidade@cbrl.dev'

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
        Política de privacidade
      </h1>
      <p className="text-muted-foreground mt-4 text-sm">Última atualização: {LAST_UPDATED}</p>

      <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none">
        <p>
          Esta política descreve como o Imovil trata seus dados. Postura: rigorosa em relação à LGPD
          (Lei 13.709/2018) — segurança e minimização de dados são pilares do produto desde o dia 1.
        </p>

        <h2>O que coletamos</h2>
        <p>
          Imovil é uma plataforma de anúncios de imóveis. Coletamos diferentes dados conforme você é
          visitante público ou broker autenticado:
        </p>

        <h3>Visitantes (sem conta)</h3>
        <ul>
          <li>
            <strong>Nenhum dado pessoal é coletado por padrão</strong>. Catálogo de imóveis é
            público; navegação não exige conta.
          </li>
          <li>
            <strong>Endereço IP</strong>: registrado temporariamente em logs de plataforma para
            segurança operacional. Base legal: legítimo interesse (LGPD Art. 7º, IX).
          </li>
        </ul>

        <h3>Brokers (autenticados)</h3>
        <ul>
          <li>
            <strong>E-mail e nome</strong> (via Google OAuth). Base legal: execução de contrato
            (LGPD Art. 7º, V).
          </li>
          <li>
            <strong>Telefone e CRECI</strong>: opcionais, declarados pelo broker para aparecer como
            contato no anúncio. Base legal: consentimento (LGPD Art. 7º, I).
          </li>
          <li>
            <strong>Dados dos imóveis cadastrados</strong>: endereço, preço, fotos, descrição.
            Publicados explicitamente pelo broker — equivalente a anúncio em portal imobiliário.
          </li>
        </ul>

        <h3>Localmente, no seu navegador</h3>
        <ul>
          <li>
            <strong>Rascunho de imóvel em edição</strong>: armazenado apenas no seu próprio
            dispositivo enquanto você preenche o formulário. Nunca é enviado para nossos servidores
            até você publicar, e é apagado automaticamente quando você sai da conta.
          </li>
        </ul>

        <h2>Compartilhamento</h2>
        <p>Operadores necessários para a operação do serviço:</p>
        <ul>
          <li>
            <strong>Supabase</strong>: banco de dados, autenticação e armazenamento das fotos dos
            imóveis.
          </li>
          <li>
            <strong>Vercel</strong>: hospedagem do site e medição anônima de audiência, sem cookies.
          </li>
          <li>
            <strong>Google</strong>: login com a sua conta Google (recebemos nome, e-mail e foto do
            perfil).
          </li>
          <li>
            <strong>BrasilAPI</strong>: consulta de endereço a partir do CEP que você digita ao
            cadastrar um imóvel. Apenas o CEP é enviado, sem dados pessoais. BrasilAPI é uma
            iniciativa pública e colaborativa brasileira (
            <a
              href="https://brasilapi.com.br"
              className="text-foreground underline"
              target="_blank"
              rel="noopener"
            >
              brasilapi.com.br
            </a>
            ).
          </li>
        </ul>
        <p>Não vendemos, alugamos ou cedemos seus dados a terceiros.</p>

        <h2>Seus direitos (LGPD Art. 18)</h2>
        <ul>
          <li>Confirmar a existência de tratamento dos seus dados;</li>
          <li>Acessar seus dados;</li>
          <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>Solicitar a anonimização, bloqueio ou eliminação;</li>
          <li>Solicitar a portabilidade dos dados;</li>
          <li>Revogar o consentimento a qualquer momento.</li>
        </ul>
        <p>
          Pra exercer qualquer direito, escreva pra{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline">
            {CONTACT_EMAIL}
          </a>
          . Respondemos em até 15 dias.
        </p>

        <h2>Cookies</h2>
        <p>
          Usamos um cookie de sessão (<code>__session</code>) essencial pro login. Não usamos
          cookies de analytics ou de rastreamento.
        </p>

        <h2>Encarregado de dados (DPO)</h2>
        <p>
          Kayron Cabral. Contato:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        <h2>Histórico de versões</h2>
        <ul>
          <li>
            <strong>{LAST_UPDATED}</strong>: medição anônima de audiência, sem cookies.
          </li>
          <li>
            <strong>2026-05-07</strong>: versão inicial.
          </li>
        </ul>
      </div>
    </main>
  )
}
