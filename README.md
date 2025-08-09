# 📌 Todo Test — API

Este projeto é uma API de gerenciamento de tarefas e usuários construída com **NestJS**, usando autenticação **JWT** e persistência em banco de dados.  
A aplicação é containerizada com **Docker** e configurada para desenvolvimento rápido.

---

## 🚀 Tecnologias

- **Node.js + NestJS**
- **TypeScript**
- **JWT** (JSON Web Token) para autenticação
- **Docker + Docker Compose**
- **TypeORM**
- **PostgreSQL**
- **ESLint + Prettier**

---

## 📂 Estrutura do Projeto

```
src/
├── app.module.ts # Módulo raiz
├── main.ts # Ponto de entrada da aplicação
├── common/ # usado para salvar componentes que podem ser compartilhado em mais de um módulo
├── infra/
│ └── db/ # Configuração do banco e seeds
├── modules/
│ ├── auth/ # Módulo de autenticação
│ ├── users/ # Módulo de usuários
│ └── task/ # Módulo de tarefas (TODO)
├── helpers/ # Funções utilitárias
├── seed.ts # Script para popular o banco
```

---

## 📦 Entidades Principais

### **User**
Representa um usuário do sistema.

| Campo      | Tipo  | Descrição                                   |
|------------|-------|---------------------------------------------|
| id         | UUID  | Identificador único                         |
| name       | string| Nome completo                               |
| email      | string| E-mail (único)                              |
| password   | string| Senha criptografada                         |
| role       | enum  | Papel do usuário (`admin`, `user`)          |
| createdAt  | Date  | Data de criação                             |
| updatedAt  | Date  | Data de atualização                         |

---

### **Task**
Representa uma tarefa criada pelo usuário.

| Campo       | Tipo    | Descrição                                 |
|-------------|---------|-------------------------------------------|
| id          | UUID    | Identificador único                       |
| title       | string  | Título da tarefa                          |
| description | string  | Descrição detalhada                       |
| status      | enum    | Status (`pending`, `done`)                |
| user        | relation| Usuário dono da tarefa                    |
| createdAt   | Date    | Data de criação                           |
| updatedAt   | Date    | Data de atualização                       |

---

## 🔑 Fluxo de Autenticação

1. O usuário faz login com **e-mail** e **senha** (`POST /auth/login`).
2. Se as credenciais estiverem corretas, o servidor retorna um **token JWT**.
3. Esse token deve ser enviado no header:


para acessar rotas protegidas.

---

## 🛠 Como Rodar o Projeto


### 1. Configurar variáveis de ambiente

Clonar o projeto com:

```sh
git clone https://github.com/cosme-js/teste-cogna.git
```

Copie o arquivo `.env.sample` para `.env` e ajuste os valores conforme necessário:

```sh
cp .env.sample .env
```

💡 Como este projeto é para teste, já existe um banco de dados configurado e, ao subir a aplicação, será executada automaticamente uma seed criando o usuário administrador:

E-mail: admin@example.com

Senha: $M+n}8c0@X4n

Não há rota para criar usuários com papel admin, então utilize essas credenciais para operações administrativas.

### 2. Subir o projeto com Docker
```sh
docker-compose up --build
```

Isso vai iniciar API com o banco configurado por padrão

Seed automática para popular usuário admin.

Acessar a API:
http://localhost:3000

No modo de desenvolvimento, a documentação Swagger estará disponível em:
http://localhost:3000/api-docs

📌 Scripts Úteis

```sh
npm run start:dev	Inicia em modo desenvolvimento
npm run build	Compila o projeto
npm run seed	Executa scripts de seed manualmente
```
### Rodar os testes
Para rodar os teste é necessario fazer a instalação do projeto, o mesmo foi desenvolvido na versão 20 do NodeJS.

Após instalar o projeto com:
```sh
npm install
```
rodar testes com coverage:
```sh
npm run test:cov
```
> ⚠️ **Observação:**  
> Os testes estão abrangendo apenas controllers, services, helpers e providers.
> como a aplicação será utilizada em ambiente produtivo, a mesma está subindo com sync para banco de dados habitado

A arquitetura adotada foi o padrão MVC. O NestJS, por si só, já utiliza uma estrutura bastante semelhante ao MVC. Nesta arquitetura, temos as seguintes representações:

Model: representado pelas Entities e DTOs, que definem a estrutura dos dados, além da camada de Services, onde reside a lógica de negócio.

View: em APIs REST, corresponde ao formato da resposta, geralmente em JSON.

Controller: responsável por gerenciar as requisições, direcionar as chamadas para os Services e retornar os dados processados para a View.

No projeto, a relação entre Users e Tasks foi definida como 1:N, permitindo que cada cliente possa ter múltiplas tarefas associadas. Além disso, houve uma separação clara das entidades, como User e Address, para facilitar futuras alterações, como a possibilidade de um usuário possuir vários endereços.

Também foi criada uma tabela de suporte para evitar que a aplicação ficasse dependente exclusivamente de APIs externas. Assim, ao cadastrar um usuário, o sistema primeiro verifica se já existe algum endereço cadastrado com aquele CEP. Caso não exista, realiza a consulta nas APIs externas.

Para garantir flexibilidade na busca de informações de endereço, a API foi estruturada utilizando o padrão Strategy. Esse padrão permite que o sistema dependa apenas de uma interface, e no módulo de AddressStorage é injetado um array de providers. Dessa forma, é possível implementar múltiplos providers para retornar as informações, garantindo que, se algum estiver fora do ar, outros possam ser utilizados como alternativa.

No que diz respeito à segurança, foram criados dois guards e estratégias (strategies) para validar o access_token do cliente. A primeira é a LocalStrategy, responsável por validar as credenciais no login, ou seja, email e senha do usuário. Ao validar com sucesso, é gerado um access_token que inclui informações embutidas do usuário, como id, nome, email e role, e esse token é retornado na resposta do login.

Ao acessar rotas protegidas, o token é processado pela estratégia JwtStrategy, que decodifica o token e injeta as informações do usuário no contexto da execução (objeto req). Isso permite que, dependendo da ação, a aplicação realize buscas, alterações ou deleções apenas nos dados do usuário autenticado, garantindo a segurança e isolamento das informações, sem afetar dados de outros usuários.

Nas Controllers, foi criado e utilizado um decorator chamado Roles para abstrair a lógica de validação de acesso às rotas. Isso torna o código menos verboso e mais reutilizável, centralizando o controle de permissões e facilitando a manutenção.

Segue video de teste:
https://jam.dev/c/e64fdcaa-8d89-4b88-a6cd-2236f6768573