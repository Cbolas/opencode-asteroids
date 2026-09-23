# Asteroids

Clone do clássico de arcade **Asteroids** implementado em canvas HTML5 puro, sem dependências ou bundler.

## Descrição

Nave espacial em um campo de asteroides com transição contínua nas bordas (o espaço é toroidal). Destrua asteroides para somar pontos: os grandes se dividem em médios, os médios em pequenos. Inclui power-ups especiais e tipos únicos de asteroides, como a estrela cadente.

## Tecnologias

* **HTML5 Canvas** — renderização 2D
* **JavaScript (ES6+)** — lógica do jogo em um único arquivo `game.js`
* Sem frameworks, sem bundler, sem dependências

## Como executar

Abra o `index.html` diretamente no navegador (clique duplo), ou use um servidor local:

```bash
npx serve .

```

Em seguida, acesse `http://localhost:3000`.

## Controles

| Tecla | Ação |
| --- | --- |
| `←` `→` | Girar nave |
| `↑` | Propulsão |
| `Espaço` | Atirar |

## Pontuação

| Asteroide | Pontos |
| --- | --- |
| Grande | 20 |
| Médio | 50 |
| Pequeno | 100 |

## Recursos

* 3 vidas com invencibilidade temporária ao renascer (piscando)
* Asteroides se dividem em fragmentos menores ao serem destruídos
* Partículas de explosão ao destruir asteroides
* Power-up de velocidade: liberado aleatoriamente ao destruir asteroides; ao coletá-lo, a nave se move duas vezes mais rápido durante 5 segundos
* Estrela cadente: asteroide especial amarelo, muito rápido, que entra periodicamente pelas bordas da tela e desaparece sozinho após alguns segundos; ao atingi-la, divide-se em duas estrelas menores e ainda mais rápidas — não vale pontos, é só perigo