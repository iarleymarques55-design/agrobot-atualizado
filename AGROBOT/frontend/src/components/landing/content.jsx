import { IconCamera, IconDoc, IconDrop, IconFlask, IconLayers, IconSprout, IconWheat } from './icons';

// ── Módulos técnicos exibidos na Landing ──
export const TECHNICAL_MODULES = [
  {
    id: 'pragas',
    title: 'Diagnóstico de pragas e doenças',
    desc: 'Identificação de pragas, doenças e sintomas com recomendações técnicas.',
    image: '/images/leaf_disease.webp',
    badge: 'Análise de imagem',
    icon: <IconSprout />,
  },
  {
    id: 'solo',
    title: 'Análise de solo',
    desc: 'Interpretação de resultados laboratoriais e recomendações de correção do solo.',
    image: '/images/soil_analysis.webp',
    badge: 'Química do solo',
    icon: <IconFlask />,
  },
  {
    id: 'insumos',
    title: 'Recomendação de insumos',
    desc: 'Orientação sobre insumos conforme a cultura, as condições e os dados disponíveis.',
    image: '/images/crop_inputs.webp',
    badge: 'Nutrição e manejo',
    icon: <IconWheat />,
  },
  {
    id: 'irrigacao',
    title: 'Manejo de irrigação',
    desc: 'Orientações para o uso eficiente da água e a produtividade agrícola.',
    image: '/images/irrigation.webp',
    badge: 'Engenharia hídrica',
    icon: <IconDrop />,
  },
  {
    id: 'laudos',
    title: 'Exportação de laudos',
    desc: 'Geração de relatórios técnicos em PDF e Word, conforme as funcionalidades existentes.',
    image: '/images/crop_sunset.webp',
    badge: 'Documentação técnica',
    icon: <IconDoc />,
  },
];

// ── 4 Etapas da Metodologia Agronômica ──
export const METHODOLOGY_STEPS = [
  {
    num: '1',
    title: 'Coleta de dados',
    desc: 'Recebimento de imagens, informações da cultura e resultados de análises laboratoriais.',
    icon: <IconCamera />,
  },
  {
    num: '2',
    title: 'Análise técnica',
    desc: 'Interpretação das informações com base em critérios agronômicos e referências disponíveis.',
    icon: <IconFlask />,
  },
  {
    num: '3',
    title: 'Construção da recomendação',
    desc: 'Organização dos resultados e apresentação de orientações contextualizadas.',
    icon: <IconLayers />,
  },
  {
    num: '4',
    title: 'Documentação técnica',
    desc: 'Apresentação das informações em relatórios claros e rastreáveis, quando disponível.',
    icon: <IconDoc />,
  },
];
