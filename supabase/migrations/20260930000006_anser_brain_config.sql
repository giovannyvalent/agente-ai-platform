-- Enriquece o cerebro do anser-monitor com dado real e parseavel: equipe (pra
-- identificar quem e quem nas mensagens do grupo), roteamento de alerta (quem
-- recebe em cada cenario) e limiares de tempo. Convencao de parsing (ver
-- lib/anser/brain-config.ts):
--   - linhas "Nome | telefone | Area" sob "## Equipe" = roster
--   - linhas "chave: valor" = config (numeros e listas separadas por virgula)
-- Mantem "tudo no cerebro" (sem coluna nova) mas de um jeito que o codigo
-- consegue ler de forma confiavel, nao regex solto em prosa livre.

UPDATE public.brains
SET content = content || $brain$

---

## Equipe (nome | telefone | área — usado pra identificar quem está na conversa)
Felipe Cardoso | 5591993866999 | Socio
Giovanny Valente | 559181628017 | Socio
Joao Tenorio | 5591981798280 | Socio
Ana Carolina | 5591982695419 | Administrativo
Rebeka Vaz | 5591984186284 | BPO
Ana Tereza | 5591991652819 | BPO
Gabriel Cunha | 5591987262775 | BPO
Laysa Tenorio | 5591984926188 | BPO
Rayane Vulcao | 5591998334669 | BPO
Alef Farias | 5591981673976 | BPO
Guidion Dantas | 5591989069411 | Consultoria
Jonatas Brandao | 5591988643332 | Consultoria
Ana Larissa | 5591980631975 | Consultoria
Amanda Carneiro | 5591988886003 | Consultoria
Gabriel Bastos | 5591981222999 | Consultoria
Armando Lobato | 5591984944115 | Consultoria
Atendimento Anser | 5591996266226 | BPO

## Config — roteamento de alertas (telefones separados por vírgula)
alerta_bpo_comercial: 5591993866999, 559181628017, 5591984186284
alerta_consultoria_comercial: 5591981798280, 5591989069411, 559181628017
alerta_fora_horario: 5591993866999, 5591981798280, 559181628017

## Config — limiares de tempo (minutos, exceto onde indicado em horas/dias)
bpo_pendente_amarelo_min: 30
bpo_pendente_vermelho_min: 60
bpo_inativo_amarelo_horas: 12
bpo_inativo_vermelho_horas: 24
consultoria_pendente_amarelo_min: 60
consultoria_pendente_vermelho_min: 120
consultoria_inativo_amarelo_dias: 2
consultoria_inativo_vermelho_dias: 3

## Config — grupos excluídos do monitoramento (nomes separados por vírgula)
grupos_excluidos: Anser | BPO, Anser | Consultores
$brain$
WHERE agent_id = 'anser-monitor';
