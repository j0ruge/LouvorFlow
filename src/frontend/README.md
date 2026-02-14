# 🎵 EscalaCanto

<div align="center">

![EscalaCanto Logo](https://img.shields.io/badge/EscalaCanto-Gestão%20Musical-7C3AED?style=for-the-badge&logo=music&logoColor=white)

**Sistema de Gestão de Escalas Musicais para Ministérios de Louvor**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.1-06B6D4?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

[Demo](https://escalacanto.lovable.app) · [Reportar Bug](https://github.com/ChewieSoft/EscalaCanto/issues) · [Solicitar Feature](https://github.com/ChewieSoft/EscalaCanto/issues)

</div>

---

## 📖 Sobre o Projeto

O **EscalaCanto** é um projeto desenvolvido por um grupo de jovens com o objetivo de aprender, se divertir e criar uma ferramenta útil para a gestão de ministérios de louvor em igrejas. O sistema facilita a organização de escalas musicais, gerenciamento de repertório, controle de integrantes e geração de relatórios.

### 🎯 Objetivos do Projeto

- 📚 **Aprendizado**: Desenvolver habilidades em programação full-stack
- 🤝 **Trabalho em Equipe**: Colaboração entre jovens desenvolvedores
- 🎵 **Utilidade Prática**: Criar uma solução real para ministérios de louvor
- 🚀 **Inovação**: Aplicar tecnologias modernas em contexto religioso

---

## ✨ Funcionalidades

### 📊 Dashboard Completo
Visão geral com estatísticas do ministério, próximas escalas e músicas em destaque.

![Dashboard](https://raw.githubusercontent.com/ChewieSoft/EscalaCanto/main/docs/screenshots/dashboard.png)

### 🎼 Gestão de Músicas
Cadastro completo de músicas com informações de tonalidade, BPM, artista e tags de categorização.

![Músicas](https://raw.githubusercontent.com/ChewieSoft/EscalaCanto/main/docs/screenshots/musicas.png)

**Recursos:**
- 🔍 Busca por nome, artista ou tonalidade
- 🎸 Visualização de tonalidade e BPM
- 🏷️ Sistema de tags (Adoração, Celebração, etc.)
- 📝 Detalhes completos de cada música

### 📅 Gerenciamento de Escalas
Criação e organização de escalas de culto com equipes completas.

![Escalas](https://raw.githubusercontent.com/ChewieSoft/EscalaCanto/main/docs/screenshots/escalas.png)

**Recursos:**
- 📆 Planejamento por data e tipo de culto
- 👥 Definição de ministro, cantores e músicos
- 🎵 Seleção de músicas para cada culto
- ✅ Status de confirmação (Confirmada/Pendente)
- 📱 Compartilhamento via WhatsApp

### 👥 Controle de Integrantes
Cadastro e gerenciamento completo dos membros do ministério.

![Integrantes](https://raw.githubusercontent.com/ChewieSoft/EscalaCanto/main/docs/screenshots/integrantes.png)

**Recursos:**
- 👤 Perfis detalhados com foto
- 🎭 Funções (Ministro, Cantor, Músico)
- 🎹 Instrumentos que cada músico toca
- 📞 Informações de contato
- 📧 Ações rápidas de edição e contato

### 📈 Relatórios e Análises
Estatísticas detalhadas sobre participação e performance do ministério.

**Métricas:**
- 🔝 Top músicas mais tocadas
- 📊 Análise de participação
- 📅 Histórico de escalas
- 📉 Tendências mensais

### 🕐 Histórico
Consulta de todas as escalas e cultos já realizados.

**Recursos:**
- 📜 Visualização cronológica
- 🔍 Filtros por data e tipo
- 📊 Estatísticas de cada culto
- 👥 Equipe que participou

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18.3** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Superset JavaScript com tipagem estática
- **Vite** - Build tool moderna e rápida
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI reutilizáveis e acessíveis
- **React Router** - Navegação entre páginas
- **Lucide React** - Biblioteca de ícones

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web para Node.js
- **PostgreSQL** - Banco de dados relacional
- **Prisma** - ORM moderno para TypeScript/Node.js

### Ferramentas
- **Git** - Controle de versão
- **GitHub** - Hospedagem de código
- **Lovable** - Plataforma de desenvolvimento visual

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn
- PostgreSQL (para backend)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/ChewieSoft/EscalaCanto.git
cd EscalaCanto
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Execute o projeto em desenvolvimento**
```bash
npm run dev
```

5. **Acesse no navegador**
```
http://localhost:5173
```

### Build para Produção

```bash
npm run build
npm run preview
```

---

## 📁 Estrutura do Projeto

```
EscalaCanto/
├── src/
│   ├── components/        # Componentes React reutilizáveis
│   │   ├── ui/           # Componentes shadcn/ui
│   │   ├── AppLayout.tsx # Layout principal
│   │   ├── AppSidebar.tsx # Barra lateral de navegação
│   │   └── NavLink.tsx   # Componente de link customizado
│   ├── pages/            # Páginas da aplicação
│   │   ├── Dashboard.tsx # Dashboard principal
│   │   ├── Songs.tsx     # Gestão de músicas
│   │   ├── Scales.tsx    # Gestão de escalas
│   │   ├── Members.tsx   # Gestão de integrantes
│   │   ├── Reports.tsx   # Relatórios e análises
│   │   └── History.tsx   # Histórico de escalas
│   ├── hooks/            # Custom React Hooks
│   ├── lib/              # Utilitários e helpers
│   ├── App.tsx           # Componente raiz
│   ├── main.tsx          # Entry point
│   └── index.css         # Estilos globais e tokens
├── public/               # Arquivos estáticos
├── docs/                 # Documentação e screenshots
└── README.md            # Este arquivo
```

---

## 🎨 Design System

O EscalaCanto utiliza um design system personalizado focado em:
- 🎨 **Paleta de cores** inspirada em música e adoração
- 🌈 **Gradientes suaves** em tons de roxo e azul
- 📱 **Responsividade** para desktop, tablet e mobile
- ♿ **Acessibilidade** seguindo padrões WCAG
- 🎯 **Componentes consistentes** com shadcn/ui

### Tokens de Design

```css
/* Cores Principais */
--primary: 262.1 83.3% 57.8%    /* Roxo vibrante */
--secondary: 220 14.3% 95.9%    /* Cinza claro */
--accent: 262.1 83.3% 67.8%     /* Roxo claro */

/* Gradientes */
--gradient-primary    /* Gradiente roxo */
--gradient-subtle     /* Gradiente sutil de fundo */
--gradient-card       /* Gradiente para cards */
```

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Este é um projeto de aprendizado, então não tenha medo de contribuir.

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### 📋 Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação, ponto e vírgula faltando, etc
- `refactor:` Refatoração de código
- `test:` Adicionando testes
- `chore:` Atualizando tarefas de build, etc

---

## 👥 Equipe de Desenvolvimento

Este projeto está sendo desenvolvido por um grupo de jovens apaixonados por tecnologia e música:

- **Desenvolvedores Frontend** - Interface e experiência do usuário
- **Desenvolvedores Backend** - API e banco de dados
- **UI/UX Designers** - Design e prototipação
- **Testadores** - Garantia de qualidade

Quer fazer parte da equipe? Entre em contato!

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Contato

**EscalaCanto** - Projeto do Grupo de Jovens

- 🌐 Website: [escalacanto.lovable.app](https://escalacanto.lovable.app)
- 📧 Email: contato@escalacanto.com
- 💬 GitHub Issues: [Criar Issue](https://github.com/ChewieSoft/EscalaCanto/issues)

---

## 🙏 Agradecimentos

- [Lovable](https://lovable.dev) - Plataforma de desenvolvimento
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Lucide Icons](https://lucide.dev/) - Biblioteca de ícones
- Todos os membros do grupo que contribuem para este projeto

---

<div align="center">

**[⬆ Voltar ao topo](#-escalacanto)**

Feito com ❤️ e 🎵 por jovens aprendendo e se divertindo

⭐ Deixe uma estrela se este projeto te ajudou!

</div>
