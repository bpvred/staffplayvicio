/**
 * Cloudflare Worker para enviar candidaturas ao Discord sem expor o webhook.
 * Crie uma variável secreta chamada DISCORD_WEBHOOK_URL no Worker.
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Método não permitido', { status: 405, headers: cors });
    if (!env.DISCORD_WEBHOOK_URL) return new Response('Webhook não configurado', { status: 500, headers: cors });

    try {
      const d = await request.json();
      const fields = [
        ['👤 Dados', `**Nick:** ${d.nick}\n**ID:** ${d.id}\n**Idade:** ${d.idade}\n**Discord:** ${d.discord}\n**Tempo no servidor:** ${d.tempo_servidor}\n**Experiência em Staff:** ${d.experiencia_staff}`],
        ['📚 Conhecimentos', `**Roleplay:** ${d.rp}\n\n**MG:** ${d.mg}\n\n**PG:** ${d.pg}\n\n**DM:** ${d.dm}\n\n**VDM:** ${d.vdm}\n\n**Jogador desrespeitoso:** ${d.jogador_desrespeitoso}`],
        ['🛡️ Situações administrativas', `**Bug de veículo:** ${d.bug_veiculo}\n\n**Discussão entre jogadores:** ${d.discussao_jogadores}\n\n**Erro de membro da Staff:** ${d.erro_staff}\n\n**Denúncia sem provas:** ${d.denuncia_sem_provas}\n\n**Possível cheat:** ${d.possivel_cheat}`],
        ['🎧 Atendimento', `**Bom atendimento:** ${d.bom_atendimento}\n\n**Jogador nervoso:** ${d.jogador_nervoso}\n\n**Calma sob pressão:** ${d.calma_pressao}`],
        ['⏰ Compromisso', `**Horas por dia:** ${d.horas_dia}\n**Dias e horários:** ${d.dias_horarios}\n**Microfone:** ${d.microfone}\n**Sigilo e regras:** ${d.sigilo}\n\n**Motivo para entrar:** ${d.motivo_staff}\n\n**O que agrega:** ${d.agregar_equipe}`],
        ['⭐ Pergunta final', d.pergunta_final]
      ];

      const embeds = fields.map(([name, value], index) => ({
        title: index === 0 ? `📩 Nova candidatura Staff · ${d.protocol}` : name,
        description: value.slice(0, 4000),
        color: 14818093,
        footer: index === fields.length - 1 ? { text: `Enviado em ${new Date(d.submittedAt).toLocaleString('pt-BR')} · Tempo: ${Math.floor(d.durationSeconds/60)} min` } : undefined
      }));

      const discord = await fetch(env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Recrutamento BPV', embeds })
      });
      if (!discord.ok) throw new Error(`Discord: ${discord.status}`);
      return new Response(JSON.stringify({ ok: true, protocol: d.protocol }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ ok: false, error: 'Falha no envio' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
  }
};
