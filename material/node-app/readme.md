# Hello-app
Aqui o nome ja sugere algo para descobertas... não é um hello world, e sim um hello-app.

A intenção aqui é ter uma aplicação web com um SQLite onde você pode gerar trafego via Kuma, cadastrar usuarios e consultar usuarios... dessa forma gerando métricas pra ser coletadas por qualquer ferramenta de observabilidade que você esteja testando.

Nesse repositorio tem o arquivo node, o compose para o app e para o kuma, e tambem o dockerfile dos mesmos.

Quais os endereços que você vai poder consultar aqui:

- http://localhost:3005/add -> adicionar usuarios no banco
- http://localhost:3005/list -> listar os usuarios cadastrados
- http://localhost:3005/error -> gerar erros pra testes (500)
- http://localhost:3005/health -> retornar a saude do app (OK)

## Estrutura final

docker compose up -d

        │
        ├── hello-app
        │     ├── Node :3005
        │     └── SQLite
        │
        └── uptime-kuma :3001
              │
              └── monitora
                  http://hello-app:3005/health