---
description: Cria um git worktree em .worktrees/ com o nome passado como argumento
---
O usuário quer criar um worktree chamado: $ARGUMENTS

Execute exatamente um comando:

git worktree add .worktrees/<nome>

Onde <nome> é o nome acima com TODOS os espaços substituídos por hífens (-).
Ex.: se o nome for "minha feature", execute `git worktree add .worktrees/minha-feature`.

Não faça mais nada: sem commit, sem trocar de diretório, sem editar arquivos.
Apenas crie o worktree e informe o resultado.
