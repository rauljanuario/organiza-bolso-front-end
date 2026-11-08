# Organiza Bolso

Esse é um sistema de controle financeiro com importação de arquivos CSV e OFX.

---
## Stacks

### Back-End
* **Java 25**
* **Spring Boot 3**
* **Spring Data JPA**
* **Spring Security (JWT)**
* **PostgreSQL**
* **Maven**
* **JUnit 5**
* **Mockito**
* **Flyway**
  
---

## Funcionalidades
* **Gestão de Usuários**: cadastro e autentificação segura.
* **Planilha**: usada para organizar os gastos.
* **Segurança**: proteção de endpoints sensíveis via tokens JWT.
* **Testes**: verificação de funcionalidades.

---

## Como Executar

### Pré-requisitos
* JDK 25 ou superior
* Maven instalado
* PostgreSQL ativo (local)

### Passos para Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/rauljanuario/organiza-bolso.git](https://github.com/rauljanuario/organiza-bolso.git)
    cd organiza-bolso
    ```

2.  **Configure o banco de dados:**
    Edite o arquivo `src/main/resources/application.properties` com as suas credenciais:
    ```properties
    spring.datasource.url=jdbc:postgresql://localhost:5432/organiza-bolso
    spring.datasource.username=seu_utilizador
    spring.datasource.password=sua_senha
    ```

3.  **Execute a aplicação:**
    ```bash
    mvn spring-boot:run
    ```
    A API estará disponível em `http://localhost:8080`.

---

## Endpoints 

Esta documentação descreve todos os endpoints disponíveis na API do sistema de controle de gastos. 

**Autenticação:** Exceto pelos endpoints de registro e login, todas as requisições requerem autenticação via JWT. O token deve ser enviado no cabeçalho da requisição:
`Authorization: Bearer <seu_token_jwt>`

---

### 1. Autenticação

Responsável pelo registro de novas contas, autenticação e recuperação de dados do perfil do usuário logado.

| Método | Endpoint | Corpo da Requisição (JSON) | Status de Sucesso | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | `{ "name": "", "email": "", "password": "" }` | `201 Created` | Cria uma nova conta de usuário. |
| `POST` | `/api/auth/login` | `{ "email": "", "password": "" }` | `200 OK` | Autentica o usuário e retorna o Token JWT. |
| `GET`  | `/api/users/me`      | Vazio | `200 OK` | Retorna os dados públicos do usuário logado (nome e e-mail) com base no token enviado no cabeçalho. |

---

### 2. Categorias

Gerencia as categorias personalizadas do usuário logado.

| Método | Endpoint | Corpo da Requisição (JSON) | Status de Sucesso | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Vazio | `200 OK` | Lista todas as categorias cadastradas pelo usuário. |
| `POST` | `/api/categories` | `{ "name": "", "type": "INCOME" / "EXPENSE" }` | `201 Created` | Cria uma nova categoria. |
| `PUT` | `/api/categories/{id}`| `{ "name": "", "type": "INCOME" / "EXPENSE" }` | `200 OK` | Atualiza os dados de uma categoria existente. |
| `DELETE`| `/api/categories/{id}`| Vazio | `204 No Content` | Remove uma categoria (transações vinculadas terão a categoria definida como nula). |

---

### 3. Regras de Categorização

Gerencia as regras de associação automática de palavras-chave a categorias específicas.

| Método | Endpoint | Corpo da Requisição (JSON) | Status de Sucesso | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/category-rules` | Vazio | `200 OK` | Lista todas as regras cadastradas pelo usuário. |
| `POST` | `/api/category-rules` | `{ "keyword": "", "categoryId": 1, "priority": 1 }` | `201 Created` | Cria uma nova regra de categorização. |
| `PUT` | `/api/category-rules/{id}`| `{ "keyword": "", "categoryId": 1, "priority": 1 }` | `200 OK` | Atualiza os parâmetros de uma regra. |
| `DELETE`| `/api/category-rules/{id}`| Vazio | `204 No Content` | Remove uma regra do sistema. |

---

### 4. Transações

Gerencia os registros financeiros, permitindo listagem e inserção manual.

| Método | Endpoint | Parâmetros da URL / Body | Status de Sucesso | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/transactions` | `?month=08&year=2026` | `200 OK` | Lista as transações do mês especificado. |
| `POST` | `/api/transactions` | `{ "description": "", "amount": 0.0, "transactionDate": "YYYY-MM-DD", "categoryId": 1 }` | `201 Created` | Insere uma transação manualmente. |
| `PUT` | `/api/transactions/{id}`| `{ "description": "", "amount": 0.0, "transactionDate": "YYYY-MM-DD", "categoryId": 1 }` | `200 OK` | Atualiza uma transação (define `manually_categorized = true` internamente). |
| `DELETE`| `/api/transactions/{id}`| Vazio | `204 No Content` | Remove uma transação específica. |

---

### 5. Importações de Extrato

Responsável pelo processamento de arquivos CSV/OFX e categorização em lote.

| Método | Endpoint | Corpo da Requisição | Status de Sucesso | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/imports` | `multipart/form-data` (file) | `201 Created` | Recebe o arquivo, aplica as regras de categorização e persiste as transações. |
| `GET` | `/api/imports` | Vazio | `200 OK` | Retorna o histórico e status de arquivos importados pelo usuário. |
| `DELETE`| `/api/imports/{id}` | Vazio | `204 No Content` | Desfaz uma importação (remove o registro e todas as transações vinculadas via cascade). |

---

### 6. Resumos e Métricas

Provê os dados agregados para renderização de gráficos e totalizadores no front-end.

| Método | Endpoint | Parâmetros da URL | Status de Sucesso | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | `?month=08&year=2026` | `200 OK` | Retorna o total de entradas, saídas e o saldo final do período. |
| `GET` | `/api/dashboard/categories`| `?month=08&year=2026&type=EXPENSE`| `200 OK` | Retorna o somatório de valores agrupados por categoria (ideal para gráficos). |

---
Desenvolvido por [Raul Januario](https://www.linkedin.com/in/rauljanuario)
