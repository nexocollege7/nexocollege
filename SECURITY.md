# NexoCollege — Security Roadmap

## Auditoria realizada em 09/07/2026
Score: 92/100

## ✅ Corrigido

| Commit | Vulnerabilidade |
|---|---|
| aad72b5 | VULN-01 + VULN-02 — Rate limit e sanitização de Host header no middleware |
| 3324621 | VULN-04 — Remover any e sanitizar erro de upload |
| 11bb4b9 | VULN-06 — Rate limit nos webhooks de pagamento e upgrade |
| f24ca5f | VULN-03 — Magic bytes nos uploads de imagem |
| 68d1f1e | VULN-05 — Normalizar enumeração de usuários em colaboradores |
| a4688cf | VULN-09 + VULN-10 — Sanitizar logs de erro MP e limite de payload |
| cad25c2 | VULN-residual — Sanitizar mensagens de erro do Supabase ao cliente |

## 🔵 Sprints Futuros

### VULN-07 — Escopo do token Vercel (Baixo risco)
- **O que é:** Token VERCEL_API_TOKEN tem escopo Full Account em vez de Specific Project
- **Risco:** Em caso de vazamento, atacante poderia gerenciar todos os projetos da conta
- **Ação:** Revogar token atual, criar novo com scope restrito ao projeto nexocollege
- **Esforço:** 10 minutos (sem código)

### VULN-08 — CSRF nas Server Actions (Médio)
- **O que é:** Server Actions sensíveis (saveCustomDomain, saveMpToken) sem proteção CSRF explícita
- **Risco:** Requisições forjadas de outros domínios poderiam executar ações em nome do usuário
- **Ação:** Adicionar verificação de Origin header nas actions críticas
- **Esforço:** 2h

### VULN-11 — Subresource Integrity — SRI (Baixo)
- **O que é:** Scripts externos carregados sem hash de integridade
- **Risco:** Se CDN externo for comprometido, scripts maliciosos podem ser carregados
- **Ação:** Adicionar atributo integrity nos scripts externos do layout
- **Esforço:** 30 minutos

### VULN-12 — Cookie Partitioned / CHIPS (Baixo)
- **O que é:** Cookies de sessão sem atributo Partitioned
- **Risco:** Em navegadores modernos com CHIPS, cookies cross-site podem ser bloqueados causando problemas de sessão
- **Ação:** Adicionar atributo Partitioned nos cookies de sessão do Supabase SSR
- **Esforço:** 1h

### VULN-13 — CSP Report-URI (Baixo)
- **O que é:** Content-Security-Policy configurado sem report-uri
- **Risco:** Violações de CSP em produção não são monitoradas — ataques XSS passam despercebidos
- **Ação:** Adicionar report-uri no next.config.ts apontando para endpoint de logging
- **Esforço:** 1h

---
*Próxima auditoria recomendada: antes do primeiro cliente pagante ou a cada 3 meses.*
