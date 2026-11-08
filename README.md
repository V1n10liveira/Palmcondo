# Palmcondo

Sistema web de controle de acesso para condomínios residenciais, desenvolvido para proporcionar mais segurança, organização e praticidade na gestão de entradas e saídas de moradores, visitantes, prestadores de serviços e colaboradores.

O projeto tem como foco condomínios que não possuem portaria presencial, permitindo que os moradores realizem autorizações de acesso e que a administração acompanhe as movimentações.

## Objetivo do projeto

O Palmcondo busca modernizar o controle de acesso em condomínios residenciais por meio de uma plataforma digital, centralizando informações de moradores, apartamentos, autorizações e registros de acesso.

## Funcionalidades implementadas

- Autenticação de usuários com JWT.
- Middleware para validação de autenticação.
- Cadastro e consulta de usuários.
- Cadastro, listagem, consulta, atualização e gerenciamento de apartamentos.
- Cadastro e consulta de moradores.
- Criação e gerenciamento de autorizações de acesso.
- Controle de acesso aos dados conforme o perfil do usuário.
- Integração com banco de dados MySQL utilizando Prisma ORM.

## Tecnologias utilizadas

### Backend — em desenvolvimento

- Node.js
- Express.js
- JavaScript
- MySQL
- Prisma ORM
- API REST
- JWT (JSON Web Token)
- bcryptjs

### Interface — planejada

- HTML5
- CSS3
- JavaScript
- React.js
- Bootstrap 5
- Progressive Web App (PWA)

### Ferramentas

- Visual Studio Code
- Postman
- Git
- GitHub

## Arquitetura do projeto

O sistema utiliza uma arquitetura cliente-servidor, com backend responsável pelas regras de negócio, autenticação e comunicação com o banco de dados por meio de uma API REST.

A interface web será desenvolvida utilizando React.js, com possibilidade de instalação como PWA em dispositivos móveis.

## Banco de dados

O projeto utiliza MySQL para armazenamento das informações e Prisma ORM para o mapeamento e acesso aos dados.

O banco contempla entidades relacionadas a:

- Condomínios;
- Usuários;
- Moradores;
- Apartamentos;
- Colaboradores;
- Pessoas (visitantes e prestadores de serviços);
- Dados específicos dos prestadores de serviços;
- Autorizações;
- Registros de acesso;
- Portões;
- Notificações;
- Logs do sistema.

## Como executar o projeto

### Pré-requisitos

- Node.js
- npm
- MySQL Server

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/V1n10liveira/Palmcondo.git
```

2. Acesse a pasta do projeto:

```bash
cd Palmcondo
```

3. Instale as dependências:

```bash
npm install
```

4. Configure o arquivo `.env` na raiz do projeto, definindo a conexão com o banco de dados e a chave secreta JWT.

Exemplo de configuração:

```env
DATABASE_URL="mysql://USUARIO:SENHA@localhost:3306/palmcondo"
JWT_SECRET="SUA_CHAVE_SECRETA"
```

5. Gere o Prisma Client:

```bash
npx prisma generate
```

6. Inicie o servidor em ambiente de desenvolvimento:

```bash
npm run dev
```

A API estará disponível localmente na porta 3000, conforme a configuração atual do servidor.

## Segurança e privacidade

O Palmcondo considera a proteção dos dados pessoais como parte importante do desenvolvimento, observando os princípios da Lei Geral de Proteção de Dados Pessoais (LGPD).

O projeto prevê controles de autenticação, autorização e restrição de acesso às informações conforme o perfil do usuário.

## Status do projeto

**Em desenvolvimento.**

O backend está em construção, com funcionalidades de autenticação, gerenciamento de usuários, apartamentos, moradores e autorizações já implementadas e testadas.

A interface web e os recursos complementares serão desenvolvidos nas próximas etapas.

## Autor

Desenvolvido por **Vinicius Santos Oliveira**.

GitHub: [V1n10liveira](https://github.com/V1n10liveira)
