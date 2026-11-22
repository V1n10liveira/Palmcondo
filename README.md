# PalmCondo

Sistema web de controle de acesso para condomínios residenciais, desenvolvido para proporcionar mais segurança, organização e praticidade na gestão de solicitações e autorizações de acesso de visitantes e prestadores de serviços.

O PalmCondo foi projetado especialmente para condomínios que não possuem portaria presencial, permitindo que moradores autorizem acessos de forma digital e que a administração acompanhe as solicitações e autorizações registradas no sistema.

## Objetivo do projeto

Modernizar o controle de acesso em condomínios residenciais por meio de uma plataforma digital, centralizando informações de condomínios, apartamentos, moradores, visitantes, prestadores de serviços, solicitações e autorizações de acesso.

## Funcionalidades

- Autenticação de usuários com JWT.
- Controle de permissões conforme o perfil do usuário.
- Gerenciamento de condomínios e apartamentos.
- Consulta e vínculo de moradores aos apartamentos.
- Cadastro e gerenciamento de prestadores de serviços.
- Solicitação pública de acesso para visitantes e prestadores.
- Aprovação ou recusa de solicitações pelos moradores.
- Acompanhamento privado das solicitações de acesso.
- Criação de autorizações após a aprovação das solicitações.
- Geração e exibição de códigos de liberação com validade de 24 horas.
- Controle de validade e expiração das autorizações.
- Consulta ao histórico de solicitações e autorizações.
- Notificações para os moradores.
- Painel administrativo e informações de gestão.
- Criação e compartilhamento de convites de acesso.
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

O modelo de dados contempla estruturas relacionadas a:

- Condomínios;
- Usuários;
- Moradores;
- Apartamentos;
- Pessoas (visitantes e prestadores de serviços);
- Dados específicos dos prestadores de serviços;
- Autorizações;
- Solicitações de acesso;
- Notificações;
- Registros auxiliares do sistema.

As alterações estruturais do banco de dados são controladas por migrations do Prisma, versionadas juntamente com o projeto.

## Aplicação

**Frontend:** https://palmcondo.vercel.app

**API:** https://palmcondo-production.up.railway.app

**Acesso público para visitantes e prestadores:** https://palmcondo.vercel.app/visitante/PC-F33F028993EF

## Como executar o projeto localmente

### Pré-requisitos

- Node.js;
- npm;
- MySQL Server;
- Git.

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

4. Configure o arquivo `.env` na raiz do projeto, utilizando o `.env.example` como referência:

```env
DATABASE_URL="mysql://USUARIO:SENHA@localhost:3306/palmcondo"
JWT_SECRET="SUA_CHAVE_SECRETA"
PORT=3000
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

8. Em outro terminal, acesse a pasta do frontend:

```bash
cd frontend
```

9. Instale as dependências do frontend:

```bash
npm install
```

10. Configure o arquivo `.env.local` no diretório `frontend`, utilizando o `frontend/.env.example` como referência:

```env
VITE_API_URL="http://localhost:3000"
```

11. Inicie o frontend:

```bash
npm run dev
```

Após a inicialização, acesse o endereço local informado pelo Vite no terminal.

**Observação:** utilize credenciais próprias para o ambiente local. Não compartilhe arquivos `.env` nem publique chaves secretas no repositório.

## Segurança e privacidade

O PalmCondo considera a proteção dos dados pessoais como parte importante de sua arquitetura, observando os princípios da Lei Geral de Proteção de Dados Pessoais (LGPD).

O sistema contempla autenticação, controle de permissões e restrição de acesso às informações conforme o perfil do usuário.

Os dados utilizados durante o desenvolvimento e os testes de demonstração são fictícios.

## Limitações da versão 1.0.0

A primeira versão do PalmCondo utiliza um modelo de controle de acesso digital e híbrido, sem integração física com portões, catracas ou fechaduras eletrônicas.

O sistema ainda não contempla o registro operacional de entrada e saída de pessoas, a consulta operacional de autorizações por CPF na portaria ou a gestão completa de colaboradores e múltiplos condomínios com isolamento de dados.

Essas funcionalidades poderão ser consideradas em versões futuras do projeto.

## Status do projeto

**Versão 1.0.0 — publicada e em homologação acadêmica.**

A primeira versão do PalmCondo foi implantada em ambiente de produção, com frontend hospedado na Vercel e API e banco de dados hospedados no Railway.

A versão contempla os principais módulos funcionais desenvolvidos e testados, incluindo autenticação, gerenciamento de apartamentos, solicitações de acesso, autorizações, prestadores de serviços, notificações e convites.

O sistema está disponível para avaliação e homologação acadêmica.

## Autor

Desenvolvido por **Vinicius Santos Oliveira**.

GitHub: https://github.com/V1n10liveira