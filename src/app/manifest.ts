import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Imovil',
    short_name: 'Imovil',
    description:
      'Aluguel de imóveis com tudo o que importa no topo: preço total, bairro, distância e pet.',
    start_url: '/imoveis',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#C8502D',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
