# ICG
## Introdução à Computação Gráfica

A geração procedural de mundos é uma técnica utilizada em diversos jogos muito famosos da atualidade, tais como Minecraft, Terraria e Subnautica, entre outros. O desafio para este projeto consiste em conseguir realizar algo similar em Three.js, de modo a oferecer aos utilizadores a possibilidade de, por meio de parâmetros de entrada previamente definidos, gerarem com apenas um clique um terreno único através de ruído. Adicionalmente, proporcionar-se-á a possibilidade de explorarem o mundo que criaram através do controlo de uma free cam, manipulável através do rato. 

### O que está implementado:

| Feature                           | Descrição                                                                              |
|-----------------------------------------|----------------------------------------------------------------------------------------|
| Terrenos através de ruído    | Criação de terrenos através de algoritmos de ruído (Simplex Noise).     |
| Luz                                     | Implementação de fontes de luz para iluminar o terreno e os elementos (DirectionalLight, HemisphereLight e AmbientLight).                                   |
| Sombras                                  | Renderização de sombras para dar profundidade aos objetos.                   |
| Movimento de câmara                      | Controlo de movimentação da câmara por rato para explorar o ambiente 3D.                        |
| Atribuição de texturas                  | Aplicação de texturas aos objetos para aumentar o realismo com base na altura do terreno.                     |
| Inclusão de elementos no terreno        | Adição de objetos como árvores, rochar, água, nuvens para enriquecer a paisagem.              |
| Helper para customização do terreno     | Ferramenta para ajustar propriedades como altura, tamanho, iluminação e formato*.       |

*Relativamente à última apresentação, como falado com o professor, foi adicionado ao helper de customização do terreno a possibilidade de escolher o formato do terreno entre quadrado e circular.

Projeto: https://proceduralgen.netlify.app/

Slides: https://www.canva.com/design/DAGDDP2SUYs/WfUZdt5SnJAGDIJHy7uuvA/edit?utm_content=DAGDDP2SUYs&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

<b> João Monteiro, 102690 - LECI</b>