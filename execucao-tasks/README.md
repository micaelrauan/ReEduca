# Executador de Tasks

> Sistema de orquestração de tarefas para agentes de IA.
> O agente lê as tasks, executa cada uma, valida, e só avanca se estiver tudo correto.

## Arquivos

| Arquivo | Funcao |
|---------|--------|
| `TASKS.md` | Manifesto de tarefas — cada bloco `## Task-XXXX` define uma tarefa |
| `TASK-STATE.json` | Estado compartilhado — progresso, checkpoints e log de execucao |
| `EXEMPLO-TASKS.md` | Exemplo real de tasks para o projeto Reeduca |

## Como Usar

### 1. Criar tarefas
Edite `TASKS.md` e adicione blocos seguindo o template:
```markdown
## Task-001 — Titulo da Tarefa

**Depends:** []              # IDs das tarefas que devem terminar primeiro
**Priority:** high            # high / medium / low
**Status:** pending           # pending / in_progress / completed / failed

### Objetivo
> O que precisa ser feito.

### Critérios de Aceite
- [ ] Criterio mensuravel 1
- [ ] Criterio mensuravel 2

### Plano de Execucao
1. Passo 1
2. Passo 2

### Validacao
```bash
comando de validacao
```

### Auto-Fix
> Estrategia de auto-correcao. Max retries: 2
```

### 2. Executar
Diga ao agente: **"executar tasks"** ou **"rodar o pipeline"**

### 3. Fluxo automatico
```
Ler TASKS.md → montar DAG → executar em ordem → validar → checkpoint → proxima
                                    │
                              ┌─────┴─────┐
                              │           │
                            PASS        FAIL
                              │           │
                              │      Auto-Fix (max 2)
                              │           │
                              │     ┌─────┴─────┐
                              │     │           │
                              │   FIXED    STILL FAIL
                              │     │           │
                              │     │      FAILED → PARAR
                              │     │
                              ▼     ▼
                         Checkpoint → TASK-STATE.json
                              │
                              └──► proxima tarefa
```

### 4. Retomar de checkpoint
Se interrompido, basta mandar "executar tasks" novamente.
O agente le `TASK-STATE.json` e retoma de onde parou.

## Regras Criticas

- **NUNCA** pular tarefa cuja dependencia falhou
- **NUNCA** marcar completed sem rodar Validacao
- **NUNCA** continuar apos falha sem retry
- **SEMPRE** atualizar TASK-STATE.json apos cada acao
- **SEMPRE** ler TASK-STATE.json antes de comecar
