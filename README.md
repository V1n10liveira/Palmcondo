
# PalmCondo

Sistema web de controle de acesso para condomínios residenciais, desenvolvido para proporcionar mais segurança, organização e praticidade na gestão de entradas e saídas de moradores, visitantes, prestadores de serviços e colaboradores.

O PalmCondo foi projetado especialmente para condomínios que não possuem portaria presencial, permitindo que moradores autorizem acessos de forma digital e que a administração acompanhe as movimentações.

## Objetivo do projeto

Modernizar o controle de acesso em condomínios residenciais por meio de uma plataforma digital, centralizando informações de moradores, apartamentos, autorizações, visitantes, prestadores de serviços e registros de acesso.

## Funcionalidades

- Autenticação de usuários com JWT.
- Controle de permissões conforme o perfil do usuário.
- Gerenciamento de condomínios, apartamentos e moradores.
- Cadastro e gerenciamento de prestadores de serviços.
- Solicitação pública de acesso para visitantes e prestadores.
- Aprovação ou recusa de solicitações pelos moradores.
- Acompanhamento privado das solicitações de acesso.
- Geração e validação de códigos de liberação.
- Controle de validade das autorizações.
- Histórico de acessos e movimentações.
- Notificações para os moradores.
- Painel administrativo e indicadores de gestão.
- Compartilhamento de convites de acesso.
- Persistência de dados em MySQL utilizando Prisma ORM.

## Tecnologias utilizadas

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- Bootstrap 5
- Progressive Web App (PWA)

### Backend
- Node.js
- Express.js
- JavaScript
- API REST
- Prisma ORM
- MySQL
- JWT (JSON Web Token)
- bcryptjs

### Infraestrutura e ferramentas
- Git e GitHub
- Visual Studio Code
- Postman
- Vercel (hospedagem do frontend)
- Railway (hospedagem da API e banco de dados)

## Arquitetura do projeto

O PalmCondo utiliza arquitetura cliente-servidor.

O frontend, desenvolvido em React.js, comunica-se com o backend por meio de uma API REST construída com Node.js e Express.js.

O backend concentra as regras de negócio, autenticação, autorização e comunicação com o banco de dados MySQL, utilizando Prisma ORM.

A autenticação utiliza JWT, com controle de acesso conforme o perfil do usuário.

## Banco de dados

O sistema utiliza MySQL para armazenamento das informações e Prisma ORM para o mapeamento e acesso aos dados.

O banco contempla entidades relacionadas a:

- Condomínios;
- Usuários;
- Moradores;
- Apartamentos;
- Colaboradores;
- Pessoas (visitantes e prestadores de serviços);
- Dados específicos dos prestadores de serviços;
- Autorizações;
- Solicitações de acesso;
- Registros de acesso;
- Portões;
- Notificações;
- Logs do sistema.

As alterações estruturais do banco são controladas por migrations do Prisma.

## Aplicação

**Frontend:** https://palmcondo.vercel.app

**API:** https://palmcondo-production.up.railway.app

## Como executar o projeto localmente

### Pré-requisitos

- Node.js;
- npm;
- MySQL Server.

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/V1n10liveira/Palmcondo.git
```

2. Acesse a pasta do projeto:

```bash
cd Palmcondo
```

3. Instale as dependências do backend:

```bash
npm install
```

4. Configure o arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="mysql://USUARIO:SENHA@localhost:3306/palmcondo"
JWT_SECRET="SUA_CHAVE_SECRETA"
```

5. Gere o Prisma Client:

```bash
npx prisma generate
```

6. Aplique as migrations no banco de dados configurado:

```bash
npx prisma migrate deploy
```

7. Inicie o backend:

```bash
npm run dev
```

8. Em outro terminal, acesse o frontend:

```bash
cd frontend
npm install
npm run dev
```

Configure a variável `VITE_API_URL` no frontend apontando para a URL da API em execução.

## Segurança e privacidade

O PalmCondo considera a proteção dos dados pessoais como parte importante de sua arquitetura, observando os princípios da Lei Geral de Proteção de Dados Pessoais (LGPD).

O sistema contempla autenticação, controle de permissões e restrição de acesso às informações conforme o perfil do usuário.

Os dados utilizados durante o desenvolvimento e os testes devem ser fictícios.

## Status do projeto

**Versão 1.0.0 — em implantação e homologação.**

O sistema possui os principais módulos funcionais implementados e testados em ambiente de desenvolvimento. A versão está passando pelo processo de implantação da infraestrutura e validação do ambiente de produção.

## Autor

Desenvolvido por **Vinicius Santos Oliveira**.

GitHub: [V1n10liveira](https://github.com/V1n10liveira)
