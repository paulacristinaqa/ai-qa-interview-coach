# Ambiente remoto de custo controlado — 2026-08-29

## Estado encontrado

O projeto podia ser clonado em outra máquina, mas exigia instalação local de Node.js, Docker e um novo PostgreSQL. A Web também usava por padrão uma URL absoluta em `127.0.0.1:3001`, que não representa a API quando a interface é aberta a partir de um ambiente remoto. O script raiz `npm run dev` delegava diretamente aos workspaces e não garantia que os dois servidores de longa duração fossem iniciados em paralelo.

## Desenvolvimento realizado

- criado dev container para GitHub Codespaces com Node.js 20 e PostgreSQL 16;
- setup automático aplica Prisma Client, migrations e seed;
- ambiente usa exclusivamente `AI_PROVIDER=mock` e não solicita chave paga;
- porta 3000 permanece privada e a API não é exposta ao navegador;
- criado proxy Next.js de `/api/v1` para a API interna, válido localmente e remotamente;
- corrigido `npm run dev` para iniciar API e Web em paralelo e encerrá-las em conjunto;
- mantida compatibilidade com a URL absoluta configurada em ambientes antigos;
- ampliados os métodos CORS para preservar PATCH e DELETE no modo antigo;
- adicionadas validação automatizada da configuração e checagem do Docker Compose na CI;
- documentados limites, parada do ambiente e persistência dos dados.

## Limites e próximos riscos

- Codespaces possui cota mensal, não é hospedagem permanente e deve ser parado após o uso;
- o PostgreSQL persiste dentro do mesmo Codespace, mas é perdido se esse ambiente for excluído;
- a CI valida a criação declarativa do ambiente; o primeiro uso real pelo navegador ainda deve confirmar a experiência da conta da proprietária;
- uma etapa futura pode implementar exportação e restauração segura do banco para portabilidade independente do Codespace.
