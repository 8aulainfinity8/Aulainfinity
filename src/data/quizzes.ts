
import type { Quiz } from '../types';

export let quizzesData: Quiz[] = [
    {
        id: 'quiz1',
        videoId: 'eso_m_1', // Números Enteros, Fracciones y Decimales
        questions: [
            {
                id: 'q1_1',
                text: 'Juan se comió la mitad de una tarta y Ana un cuarto. ¿Qué fracción de la tarta queda?',
                options: ['1/4', '1/3', '3/4', 'No queda nada'],
                correctAnswerIndex: 1,
                explanation: 'Juan y Ana comieron 1/2 + 1/4 = 3/4 de la tarta. Por lo tanto, queda 1 - 3/4 = 1/4 de la tarta.'
            },
            {
                id: 'q1_2',
                text: '¿Cómo se representa el número decimal 0.75 como fracción irreducible?',
                options: ['75/100', '3/4', '7/5', '1/75'],
                correctAnswerIndex: 2,
                explanation: '0.75 es igual a 75/100. Simplificando esta fracción dividiendo numerador y denominador por 25, obtenemos 3/4.'
            }
        ]
    },
    {
        id: 'quiz_eso_m_p1',
        videoId: 'eso_m_p1', // Potencias y Raíces Cuadradas
        questions: [
            {
                id: 'q_eso_m_p1_1',
                text: 'Calcula y simplifica la expresión: (2^3 * 2^2) / 2^4',
                options: ['2^9', '2^2', '2', '2^1'],
                correctAnswerIndex: 3,
                explanation: 'Cuando se multiplican potencias de la misma base, se suman los exponentes (3+2=5). Luego, al dividir, se restan (5-4=1). El resultado es 2^1, que es 2.'
            }
        ]
    },
    {
        id: 'quiz_eso_m_p2',
        videoId: 'eso_m_p2', // Divisibilidad, MCD y mcm
        questions: [
            {
                id: 'q_eso_m_p2_1',
                text: '¿Cuál es el Mínimo Común Múltiplo (mcm) de 15 y 20?',
                options: ['5', '300', '60', '120'],
                correctAnswerIndex: 3,
                explanation: 'La descomposición de 15 es 3*5. La de 20 es 2^2*5. El mcm se calcula con los factores comunes y no comunes al mayor exponente: 2^2 * 3 * 5 = 60.'
            }
        ]
    },
    {
        id: 'quiz_eso_m_p3',
        videoId: 'eso_m_p3', // Expresiones Algebraicas y Polinomios
        questions: [
            {
                id: 'q_eso_m_p3_1',
                text: '¿Cuál es el resultado de sumar (2x + 3) + (x - 1)?',
                options: ['2x + 2', '3x + 4', '3x + 2', '2x + 4'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_eso_m_p4',
        videoId: 'eso_m_p4', // Productos Notables
        questions: [
            {
                id: 'q_eso_m_p4_1',
                text: '¿Cuál es el desarrollo de (a + b)^2?',
                options: ['a^2 + b^2', 'a^2 - 2ab + b^2', 'a^2 + 2ab + b^2', 'a^2 - b^2'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_eso_m_p5',
        videoId: 'eso_m_p5', // Ecuaciones de Primer Grado
        questions: [
            {
                id: 'q_eso_m_p5_1',
                text: 'La edad de Pedro es el triple que la de su hijo. Si ambas suman 48 años, ¿cuántos años tiene Pedro?',
                options: ['12', '24', '36', '40'],
                correctAnswerIndex: 3,
                explanation: 'Si la edad del hijo es x, la de Pedro es 3x. La ecuación es x + 3x = 48 -> 4x = 48 -> x = 12. Pedro tiene 3*12 = 36 años.'
            }
        ]
    },
    {
        id: 'quiz_eso_m_p6',
        videoId: 'eso_m_p6', // Proporcionalidad y Porcentajes
        questions: [
            {
                id: 'q_eso_m_p6_1',
                text: 'Si un artículo cuesta 50€ y tiene un 20% de descuento, ¿cuál es su precio final?',
                options: ['30€', '40€', '45€', '10€'],
                correctAnswerIndex: 2,
            }
        ]
    },
    {
        id: 'quiz_eso_g_1',
        videoId: 'eso_g_1', // Ángulos y Rectas
        questions: [
            {
                id: 'q_eso_g_1_1',
                text: 'Dos ángulos que suman 90º se llaman:',
                options: ['Suplementarios', 'Consecutivos', 'Complementarios', 'Opuestos por el vértice'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_eso_g_2',
        videoId: 'eso_g_2', // Triángulos y Cuadriláteros
        questions: [
            {
                id: 'q_eso_g_2_1',
                text: '¿Cómo se llama el triángulo que tiene los tres lados iguales?',
                options: ['Isósceles', 'Escaleno', 'Rectángulo', 'Equilátero'],
                correctAnswerIndex: 4,
            }
        ]
    },
    {
        id: 'quiz_eso_g_3',
        videoId: 'eso_g_3', // Teorema de Pitágoras
        questions: [
            {
                id: 'q_eso_g_3_1',
                text: 'En un triángulo rectángulo, si los catetos miden 3 y 4, ¿cuánto mide la hipotenusa?',
                options: ['5', '6', '7', '25'],
                correctAnswerIndex: 1,
                diagram: {
                    type: 'geometry',
                    data: { labelA: 'a = 3', labelB: 'b = 4', labelC: 'c = ?' }
                }
            }
        ]
    },
    {
        id: 'quiz_eso_g_4',
        videoId: 'eso_g_4', // Semejanza y Teorema de Tales
        questions: [
            {
                id: 'q_eso_g_4_1',
                text: 'Dos triángulos son semejantes si tienen:',
                options: ['Un lado igual', 'Sus ángulos iguales', 'Un ángulo igual', 'Sus áreas iguales'],
                correctAnswerIndex: 2,
            }
        ]
    },
    {
        id: 'quiz_eso_g_5',
        videoId: 'eso_g_5', // Cuerpos Geométricos
        questions: [
            {
                id: 'q_eso_g_5_1',
                text: '¿Qué cuerpo geométrico tiene dos bases circulares y una superficie lateral curva?',
                options: ['Cono', 'Esfera', 'Cilindro', 'Pirámide'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_eso_g_6',
        videoId: 'eso_g_6', // Áreas y Volúmenes
        questions: [
            {
                id: 'q_eso_g_6_1',
                text: '¿Cuál es el área de un círculo con radio 5?',
                options: ['10π', '25π', '5π', '100π'],
                correctAnswerIndex: 2,
            }
        ]
    },
    {
        id: 'quiz_eso_f_1',
        videoId: 'eso_f_1', // Coordenadas Cartesianas y Funciones
        questions: [
            {
                id: 'q_eso_f_1_1',
                text: 'El punto (0, 0) en un sistema de coordenadas se llama:',
                options: ['Eje X', 'Eje Y', 'Origen', 'Cuadrante'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_eso_f_2',
        videoId: 'eso_f_2', // Interpretación de Gráficas
        questions: [
            {
                id: 'q_eso_f_2_1',
                text: 'En una gráfica de distancia-tiempo, una línea horizontal representa:',
                options: ['Movimiento acelerado', 'Velocidad constante', 'Que el objeto está parado', 'Marcha atrás'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_eso_f_3',
        videoId: 'eso_f_3', // Funciones Lineales
        questions: [
            {
                id: 'q_eso_f_3_1',
                text: 'En la función y = 2x + 3, ¿qué representa el número 2?',
                options: ['La ordenada en el origen', 'La pendiente', 'Un punto de la recta', 'El eje Y'],
                correctAnswerIndex: 2,
                diagram: {
                    type: 'plot',
                    data: { equation: 'y = 2x + 3' }
                }
            }
        ]
    },
    {
        id: 'quiz_eso_e_1',
        videoId: 'eso_e_1', // Tablas de Frecuencias y Gráficos
        questions: [
            {
                id: 'q_eso_e_1_1',
                text: '¿Qué tipo de gráfico es más adecuado para representar porcentajes de un total?',
                options: ['Histograma', 'Diagrama de barras', 'Diagrama de sectores', 'Polígono de frecuencias'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_eso_e_2',
        videoId: 'eso_e_2', // Medidas de Centralización
        questions: [
            {
                id: 'q_eso_e_2_1',
                text: '¿Cuál es la media de los números 2, 4, 6?',
                options: ['2', '4', '6', '12'],
                correctAnswerIndex: 2,
            }
        ]
    },
    {
        id: 'quiz_eso_p_1',
        videoId: 'eso_p_1', // Sucesos y Probabilidad Simple
        questions: [
            {
                id: 'q_eso_p_1_1',
                text: 'Al lanzar un dado de 6 caras, ¿cuál es la probabilidad de sacar un 5?',
                options: ['1/5', '5/6', '1/6', '1'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_fyq_ac_1',
        videoId: 'fyq_ac_1', // El Método Científico
        questions: [
            {
                id: 'q_fyq_ac_1_1',
                text: '¿Cuál es el primer paso del método científico?',
                options: ['Experimentación', 'Hipótesis', 'Observación', 'Conclusión'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_fyq_ac_2',
        videoId: 'fyq_ac_2', // Magnitudes y Unidades (SI)
        questions: [
            {
                id: 'q_fyq_ac_2_1',
                text: 'En el Sistema Internacional (SI), la unidad de masa es:',
                options: ['Gramo', 'Kilogramo', 'Newton', 'Metro'],
                correctAnswerIndex: 2,
            }
        ]
    },
    {
        id: 'quiz_fyq_m_1',
        videoId: 'fyq_m_1', // Propiedades y Estados de la Materia
        questions: [
            {
                id: 'q_fyq_m_1_1',
                text: 'El paso de estado sólido a líquido se llama:',
                options: ['Fusión', 'Vaporización', 'Sublimación', 'Condensación'],
                correctAnswerIndex: 1,
            }
        ]
    },
    {
        id: 'quiz_fyq_m_2',
        videoId: 'fyq_m_2', // Densidad y Separación de Mezclas
        questions: [
            {
                id: 'q_fyq_m_2_1',
                text: 'Si un objeto tiene una masa de 20g y un volumen de 10cm³, ¿cuál es su densidad?',
                options: ['2 g/cm³', '0.5 g/cm³', '200 g/cm³', '30 g/cm³'],
                correctAnswerIndex: 1,
            }
        ]
    },
    {
        id: 'quiz_fyq_em_1',
        videoId: 'fyq_em_1', // Modelos Atómicos y Partículas
        questions: [
            {
                id: 'q_fyq_em_1_1',
                text: '¿Qué partícula subatómica tiene carga negativa?',
                options: ['Protón', 'Neutrón', 'Electrón', 'Núcleo'],
                correctAnswerIndex: 3,
                diagram: {
                    type: 'atoms'
                }
            }
        ]
    },
    {
        id: 'quiz_fyq_em_2',
        videoId: 'fyq_em_2', // Tabla Periódica y Formulación
        questions: [
            {
                id: 'q_fyq_em_2_1',
                text: 'El símbolo "Fe" en la tabla periódica corresponde a:',
                options: ['Flúor', 'Fósforo', 'Hierro', 'Francio'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_fyq_cm_1',
        videoId: 'fyq_cm_1', // Reacciones Químicas
        questions: [
            {
                id: 'q_fyq_cm_1_1',
                text: '¿Qué ley establece que la masa no se crea ni se destruye en una reacción química?',
                options: ['Ley de Newton', 'Ley de Lavoisier', 'Ley de Ohm', 'Ley de Proust'],
                correctAnswerIndex: 2,
            }
        ]
    },
    {
        id: 'quiz_fyq_mf_1',
        videoId: 'fyq_mf_1', // Cinemática: MRU y MRUA
        questions: [
            {
                id: 'q_fyq_mf_1_1',
                text: 'En un Movimiento Rectilíneo Uniforme (MRU), la velocidad es:',
                options: ['Cero', 'Variable', 'Constante', 'Creciente'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_fyq_mf_2',
        videoId: 'fyq_mf_2', // Las Leyes de Newton
        questions: [
            {
                id: 'q_fyq_mf_2_1',
                text: 'La Primera Ley de Newton también se conoce como:',
                options: ['Principio de acción y reacción', 'Ley de la gravedad', 'Principio de inercia', 'Segunda ley'],
                correctAnswerIndex: 3,
                diagram: {
                    type: 'forces'
                }
            }
        ]
    },
    {
        id: 'quiz_fyq_e_1',
        videoId: 'fyq_e_1', // Formas y Conservación de la Energía
        questions: [
            {
                id: 'q_fyq_e_1_1',
                text: 'El principio de conservación de la energía afirma que:',
                options: ['La energía se crea', 'La energía se destruye', 'La energía ni se crea ni se destruye, solo se transforma', 'La energía es siempre la misma'],
                correctAnswerIndex: 3,
            }
        ]
    },
    {
        id: 'quiz_fyq_e_2',
        videoId: 'fyq_e_2', // Energía Cinética y Potencial
        questions: [
            {
                id: 'q_fyq_e_2_1',
                text: 'La energía que posee un cuerpo debido a su movimiento se llama:',
                options: ['Energía potencial', 'Energía cinética', 'Energía térmica', 'Energía química'],
                correctAnswerIndex: 2,
            }
        ]
    },
    {
        id: 'quiz_fyq_t_1',
        videoId: 'fyq_t_1', // Temperatura, Calor y Transferencia
        questions: [
            {
                id: 'q_fyq_t_1_1',
                text: 'La transferencia de calor a través de ondas electromagnéticas se llama:',
                options: ['Conducción', 'Convección', 'Radiación', 'Dilatación'],
                correctAnswerIndex: 3,
            }
        ]
    },
    
    // --- 1º BACHILLERATO DE CIENCIAS: MATEMÁTICAS I ---
    ...[
        { videoId: 'bach_c1_m_v1', question: '¿Cuál es el valor de |-5| + |3|?', options: ['-2', '2', '8', '-8'], correct: 3 },
        { videoId: 'bach_c1_m_v2', question: 'La expresión log(a) + log(b) es igual a:', options: ['log(a+b)', 'log(a*b)', 'log(a/b)', 'log(a)^b'], correct: 2 },
        { videoId: 'bach_c1_m_v3', question: '¿Cuál es el resto de dividir (x^3 - 1) por (x - 1)?', options: ['-1', '1', '0', '2'], correct: 3 },
        { videoId: 'bach_c1_m_v4', question: 'Al simplificar (x^2 - 4) / (x - 2), ¿qué se obtiene?', options: ['x - 2', 'x + 2', 'x', 'No se puede simplificar'], correct: 2 },
        { videoId: 'bach_c1_m_v5', question: 'Una solución de la ecuación 2^x = 8 es:', options: ['x=2', 'x=4', 'x=3', 'x=8'], correct: 3 },
        { videoId: 'bach_c1_m_v6', question: 'El método de Gauss se utiliza para resolver:', options: ['Ecuaciones de segundo grado', 'Sistemas de ecuaciones lineales', 'Inecuaciones', 'Logaritmos'], correct: 2 },
        { videoId: 'bach_c1_m_v7', question: 'La solución de la inecuación 2x > 4 es:', options: ['x < 2', 'x > 2', 'x = 2', 'x < -2'], correct: 2 },
        { videoId: 'bach_c1_m_v8', question: 'El dominio de la función f(x) = 1/x es:', options: ['Todos los reales', 'R - {1}', 'R - {0}', '[0, +inf)'], correct: 3 },
        { videoId: 'bach_c1_m_v9', question: 'Si f(x) = x+1 y g(x) = 2x, ¿cuál es (g o f)(x)?', options: ['2x+1', '2x+2', 'x+2', '2x^2+2x'], correct: 2 },
        { videoId: 'bach_c1_m_v10', question: 'La gráfica de la función f(x) = x^2 es una:', options: ['Recta', 'Hipérbola', 'Parábola', 'Circunferencia'], correct: 3 },
        { videoId: 'bach_c1_m_v11', question: 'La gráfica de f(x) + 2 es la gráfica de f(x) desplazada:', options: ['2 unidades a la derecha', '2 unidades a la izquierda', '2 unidades hacia arriba', '2 unidades hacia abajo'], correct: 3 },
        { videoId: 'bach_c1_m_v12', question: 'Si el límite de f(x) cuando x tiende a "a" es f(a), la función es:', options: ['Discontinua', 'Creciente', 'Continua en "a"', 'Derivable'], correct: 3 },
        { videoId: 'bach_c1_m_v13', question: 'Una asíntota vertical en x=a ocurre si el límite de f(x) cuando x tiende a "a" es:', options: ['0', 'Infinito', '1', 'f(a)'], correct: 2 },
        { videoId: 'bach_c1_m_v14', question: 'La derivada de una función en un punto representa:', options: ['El área bajo la curva', 'La pendiente de la recta tangente', 'Un máximo', 'Un mínimo'], correct: 2 },
        { videoId: 'bach_c1_m_v15', question: '¿Cuál es la derivada de f(x) = x^3?', options: ['3x', 'x^2', '3x^2', '3x^3'], correct: 3 },
        { videoId: 'bach_c1_m_v16', question: 'La pendiente de la recta tangente a f(x) en x=a es:', options: ['f(a)', 'f\'(a)', 'f\'\'(a)', '0'], correct: 2 },
        { videoId: 'bach_c1_m_v17', question: 'Si f\'(x) > 0 en un intervalo, la función es:', options: ['Decreciente', 'Constante', 'Creciente', 'Cóncava'], correct: 3 },
        { videoId: 'bach_c1_m_v18', question: 'Un máximo relativo ocurre cuando la primera derivada:', options: ['Es positiva', 'Es negativa', 'Se anula y pasa de + a -', 'Se anula y pasa de - a +'], correct: 3 },
        { videoId: 'bach_c1_m_v19', question: 'En un triángulo rectángulo, el seno de un ángulo es:', options: ['Cateto contiguo / hipotenusa', 'Cateto opuesto / hipotenusa', 'Cateto opuesto / cateto contiguo', 'Hipotenusa / cateto opuesto'], correct: 2 },
        { videoId: 'bach_c1_m_v20', question: 'La identidad fundamental de la trigonometría es:', options: ['sen^2(x) - cos^2(x) = 1', 'sen^2(x) + cos^2(x) = 1', 'tg(x) = sen(x) / cos(x)', 'sen(x) = cos(90-x)'], correct: 2 },
        { videoId: 'bach_c1_m_1', question: 'El teorema del seno relaciona:', options: ['Los lados con los cosenos de los ángulos opuestos', 'Los lados con los senos de los ángulos opuestos', 'Un lado con la hipotenusa', 'El área con los lados'], correct: 2 },
        { videoId: 'bach_c1_m_v21', question: 'Una solución de la ecuación sen(x) = 1 es:', options: ['0º', '45º', '90º', '180º'], correct: 3 },
        { videoId: 'bach_c1_m_v22', question: 'La parte imaginaria del número complejo 3 - 4i es:', options: ['3', '4', '-4', '-4i'], correct: 3 },
        { videoId: 'bach_c1_m_v23', question: 'El conjugado de 2 + 5i es:', options: ['-2 - 5i', '2 - 5i', '-2 + 5i', '5 + 2i'], correct: 2 },
        { videoId: 'bach_c1_m_2', question: 'El producto escalar de dos vectores perpendiculares es:', options: ['1', '0', '-1', 'Depende de los vectores'], correct: 2 },
        { videoId: 'bach_c1_m_v24', question: 'La ecuación x^2 + y^2 = 9 representa:', options: ['Una elipse', 'Una hipérbola', 'Una parábola', 'Una circunferencia'], correct: 4 },
        { videoId: 'bach_c1_m_v25', question: 'La medida de centralización más sensible a valores extremos es:', options: ['La moda', 'La mediana', 'La media', 'El rango'], correct: 3 },
        { videoId: 'bach_c1_m_v26', question: 'Para representar la evolución de una variable en el tiempo, se usaría un:', options: ['Diagrama de barras', 'Diagrama de sectores', 'Gráfico de líneas', 'Histograma'], correct: 3 },
        { videoId: 'bach_c1_m_v27', question: 'La regla de Laplace se aplica a sucesos:', options: ['Dependientes', 'Independientes', 'Equiprobables', 'Cualquier suceso'], correct: 3 },
        { videoId: 'bach_c1_m_v28', question: 'La probabilidad de la intersección de dos sucesos independientes A y B es:', options: ['P(A) + P(B)', 'P(A) * P(B)', 'P(A|B)', 'P(A) - P(B)'], correct: 2 }
    ].map((q, i) => ({
        id: `quiz_bach_c1_m_${i}`,
        videoId: q.videoId,
        questions: [{ id: `q_bach_c1_m_${i}_1`, text: q.question, options: q.options, correctAnswerIndex: q.correct }]
    })),

    // --- 1º BACHILLERATO DE CIENCIAS: FÍSICA Y QUÍMICA ---
    ...[
        { videoId: 'bach_c1_fyq_v1', question: '¿Cuál es la unidad de fuerza en el Sistema Internacional?', options: ['Dina', 'Julio', 'Newton', 'Vatio'], correct: 3 },
        { videoId: 'bach_c1_fyq_v2', question: 'Si una medida es 3.14 cm, ¿cuántas cifras significativas tiene?', options: ['1', '2', '3', '4'], correct: 3 },
        { videoId: 'bach_c1_fyq_v3', question: 'La Ley de Lavoisier se refiere a la conservación de:', options: ['La energía', 'La carga', 'La masa', 'El volumen'], correct: 3 },
        { videoId: 'bach_c1_fyq_v4', question: 'Un mol de cualquier sustancia contiene:', options: ['1 gramo', '6.022x10^23 partículas', '22.4 litros', '1 átomo'], correct: 2 },
        { videoId: 'bach_c1_fyq_v5', question: 'En la ley de los gases ideales (PV=nRT), ¿qué representa R?', options: ['La presión', 'El volumen', 'La constante de los gases', 'La temperatura'], correct: 3 },
        { videoId: 'bach_c1_fyq_v6', question: '¿Qué modelo atómico introdujo los niveles de energía u órbitas?', options: ['Dalton', 'Thomson', 'Rutherford', 'Bohr'], correct: 4 },
        { videoId: 'bach_c1_fyq_v7', question: 'Los elementos del grupo 18 se llaman:', options: ['Alcalinos', 'Halógenos', 'Gases nobles', 'Anfígenos'], correct: 3 },
        { videoId: 'bach_c1_fyq_v8', question: 'El enlace iónico se forma típicamente entre:', options: ['Dos no metales', 'Dos metales', 'Un metal y un no metal', 'Un gas y un líquido'], correct: 3 },
        { videoId: 'bach_c1_fyq_1', question: '¿Cuál es la fórmula del ácido sulfúrico?', options: ['H2S', 'SO3', 'H2SO4', 'HSO4-'], correct: 3 },
        { videoId: 'bach_c1_fyq_v9', question: 'En una ecuación química, los reactivos se escriben a la:', options: ['Izquierda', 'Derecha', 'Arriba', 'Abajo'], correct: 1 },
        { videoId: 'bach_c1_fyq_v10', question: 'El reactivo que se consume por completo en una reacción se llama:', options: ['Reactivo en exceso', 'Producto', 'Reactivo limitante', 'Catalizador'], correct: 3 },
        { videoId: 'bach_c1_fyq_v11', question: 'Un hidrocarburo que solo contiene enlaces simples se llama:', options: ['Alqueno', 'Alquino', 'Alcano', 'Aromático'], correct: 3 },
        { videoId: 'bach_c1_fyq_v12', question: 'El grupo funcional -OH corresponde a un:', options: ['Ácido carboxílico', 'Aldehído', 'Alcohol', 'Éter'], correct: 3 },
        { videoId: 'bach_c1_fyq_v13', question: 'En un MRUA, si la aceleración es positiva, la velocidad:', options: ['Disminuye', 'Es constante', 'Aumenta', 'Es cero'], correct: 3 },
        { videoId: 'bach_c1_fyq_v14', question: 'En un tiro vertical hacia arriba, la velocidad en el punto más alto es:', options: ['Máxima', 'Cero', 'Constante', 'Negativa'], correct: 2 },
        { videoId: 'bach_c1_fyq_v15', question: 'La segunda ley de Newton establece que F =', options: ['m/a', 'm*a', 'm*v', 'm*g*h'], correct: 2 },
        { videoId: 'bach_c1_fyq_v16', question: 'La fuerza de rozamiento se opone siempre a:', options: ['El peso', 'La normal', 'El movimiento', 'La gravedad'], correct: 3 },
        { videoId: 'bach_c1_fyq_v17', question: 'En un MCU, la aceleración se dirige hacia:', options: ['Fuera del círculo', 'La tangente', 'El centro del círculo', 'No hay aceleración'], correct: 3 },
        { videoId: 'bach_c1_fyq_v18', question: 'El trabajo realizado por una fuerza se mide en:', options: ['Newtons', 'Vatios', 'Julios', 'Pascales'], correct: 3 },
        { videoId: 'bach_c1_fyq_v19', question: 'La energía potencial gravitatoria depende de:', options: ['La velocidad', 'La masa y la altura', 'La masa y la velocidad', 'Solo la masa'], correct: 2 },
        { videoId: 'bach_c1_fyq_v20', question: 'El calor es una forma de:', options: ['Temperatura', 'Energía en tránsito', 'Energía potencial', 'Materia'], correct: 2 },
        { videoId: 'bach_c1_fyq_v21', question: 'El primer principio de la termodinámica es una expresión de la ley de conservación de:', options: ['La masa', 'La carga', 'La energía', 'El momento'], correct: 3 }
    ].map((q, i) => ({
        id: `quiz_bach_c1_fyq_${i}`,
        videoId: q.videoId,
        questions: [{ id: `q_bach_c1_fyq_${i}_1`, text: q.question, options: q.options, correctAnswerIndex: q.correct }]
    })),

    // --- 2º BACHILLERATO DE CIENCIAS: MATEMÁTICAS II ---
    ...[
        { videoId: 'bach_c_m_4', question: 'Una matriz cuadrada tiene inversa si su determinante es:', options: ['Igual a cero', 'Distinto de cero', 'Positivo', 'Negativo'], correct: 2 },
        { videoId: 'bach_c_m_5', question: 'El método de Cramer es útil para resolver sistemas:', options: ['Incompatibles', 'Compatibles indeterminados', 'Compatibles determinados', 'No lineales'], correct: 3 },
        { videoId: 'bach_c2_m_v3', question: 'Si el rango de la matriz de coeficientes es igual al rango de la ampliada y al número de incógnitas, el sistema es:', options: ['Incompatible', 'Compatible indeterminado', 'Compatible determinado', 'Homogéneo'], correct: 3 },
        { videoId: 'bach_c2_m_v4', question: 'El producto vectorial de dos vectores paralelos es:', options: ['El vector nulo', 'Un vector unitario', '1', '0'], correct: 1 },
        { videoId: 'bach_c2_m_v5', question: 'Dos planos son paralelos si sus vectores normales son:', options: ['Perpendiculares', 'Iguales', 'Proporcionales (paralelos)', 'Unitarios'], correct: 3 },
        { videoId: 'bach_c2_m_v6', question: 'El volumen de un paralelepípedo formado por tres vectores se calcula con:', options: ['El producto escalar', 'El producto vectorial', 'El producto mixto', 'El módulo'], correct: 3 },
        { videoId: 'bach_c_m_1', question: 'Una indeterminación del tipo 0/0 se puede resolver usando:', options: ['El teorema de Bolzano', 'La regla de Ruffini', 'La regla de L\'Hôpital', 'El método de Gauss'], correct: 3 },
        { videoId: 'bach_c2_m_v7', question: 'Si el límite de f(x) cuando x tiende a infinito es 3, la función tiene una asíntota:', options: ['Vertical en x=3', 'Horizontal en y=3', 'Oblicua con pendiente 3', 'No tiene asíntota'], correct: 2 },
        { videoId: 'bach_c_m_2', question: 'La segunda derivada de una función se usa para estudiar:', options: ['La monotonía', 'La curvatura', 'Las asíntotas', 'El dominio'], correct: 2 },
        { videoId: 'bach_c2_m_v8', question: 'Un punto de inflexión ocurre cuando la segunda derivada:', options: ['Es positiva', 'Es negativa', 'Se anula y cambia de signo', 'No existe'], correct: 3 },
        { videoId: 'bach_c_m_3', question: 'La integral de una función es también conocida como:', options: ['Derivada', 'Límite', 'Primitiva o antiderivada', 'Tangente'], correct: 3 },
        { videoId: 'bach_c2_m_v9', question: 'La regla de Barrow se utiliza para calcular:', options: ['Límites', 'Derivadas', 'Integrales indefinidas', 'Integrales definidas'], correct: 4 },
        { videoId: 'bach_c2_m_v10', question: 'El área encerrada entre una función f(x) y el eje X entre a y b se calcula con:', options: ['La derivada en a y b', 'La integral definida de f(x) entre a y b', 'f(b) - f(a)', 'La integral indefinida de f(x)'], correct: 2 },
        { videoId: 'bach_c2_m_v11', question: 'El teorema de Bayes se utiliza para calcular:', options: ['Probabilidades simples', 'Probabilidades a posteriori', 'Medias', 'Varianzas'], correct: 2 },
        { videoId: 'bach_c2_m_v12', question: 'La distribución Normal se caracteriza por ser:', options: ['Asimétrica', 'Discreta', 'Simétrica y con forma de campana', 'Uniforme'], correct: 3 },
        { videoId: 'bach_c2_m_v13', question: 'El objetivo de la estadística inferencial es:', options: ['Describir una muestra', 'Hacer predicciones sobre una población a partir de una muestra', 'Calcular probabilidades', 'Dibujar gráficos'], correct: 2 }
    ].map((q, i) => ({
        id: `quiz_bach_c2_m_${i}`,
        videoId: q.videoId,
        questions: [{ id: `q_bach_c2_m_${i}_1`, text: q.question, options: q.options, correctAnswerIndex: q.correct }]
    })),

    // --- 2º BACHILLERATO DE CIENCIAS: QUÍMICA ---
    ...[
        { videoId: 'bach_c2_q_v1', question: 'El número cuántico "l" determina:', options: ['El nivel de energía', 'La forma del orbital', 'La orientación del orbital', 'El espín del electrón'], correct: 2 },
        { videoId: 'bach_c2_q_v2', question: 'La energía de ionización aumenta en la tabla periódica hacia:', options: ['Abajo y a la izquierda', 'Arriba y a la derecha', 'Abajo y a la derecha', 'Arriba y a la izquierda'], correct: 2 },
        { videoId: 'bach_c2_q_v3', question: 'Las fuerzas de Van der Waals son un tipo de fuerza:', options: ['Interatómica', 'Intramolecular', 'Intermolecular', 'Nuclear'], correct: 3 },
        { videoId: 'bach_c2_q_v4', question: 'Una reacción exotérmica es aquella que:', options: ['Absorbe calor', 'Libera calor', 'Ocurre a alta temperatura', 'Necesita un catalizador'], correct: 2 },
        { videoId: 'bach_c2_q_v5', question: 'Un catalizador:', options: ['Aumenta la energía de activación', 'Disminuye la velocidad de reacción', 'Aumenta la velocidad de reacción', 'Se consume en la reacción'], correct: 3 },
        { videoId: 'bach_c_m_6', question: 'Según el principio de Le Châtelier, si se aumenta la presión en un equilibrio gaseoso, el equilibrio se desplaza hacia:', options: ['Donde hay más moles de gas', 'Donde hay menos moles de gas', 'No se desplaza', 'La derecha siempre'], correct: 2 },
        { videoId: 'bach_c_m_7', question: 'Una disolución con pH = 2 es:', options: ['Ácida', 'Básica', 'Neutra', 'Tampón'], correct: 1 },
        { videoId: 'bach_c2_q_v6', question: 'En una pila galvánica, la oxidación ocurre en el:', options: ['Cátodo', 'Ánodo', 'Puente salino', 'Voltímetro'], correct: 2 },
        { videoId: 'bach_c2_q_v7', question: 'Dos compuestos con la misma fórmula molecular pero diferente estructura se llaman:', options: ['Isótopos', 'Isómeros', 'Alótropos', 'Polímeros'], correct: 2 },
        { videoId: 'bach_c2_q_v8', question: 'La reacción de un alqueno con H2 se clasifica como una reacción de:', options: ['Sustitución', 'Eliminación', 'Adición', 'Oxidación'], correct: 3 },
        { videoId: 'bach_c2_q_v9', question: 'Las proteínas son polímeros de:', options: ['Glucosa', 'Ácidos grasos', 'Nucleótidos', 'Aminoácidos'], correct: 4 },
        { videoId: 'bach_c2_q_v10', question: 'El elemento más abundante en la corteza terrestre es:', options: ['Hierro', 'Silicio', 'Oxígeno', 'Aluminio'], correct: 3 },
        { videoId: 'bach_c2_q_v11', question: 'La lluvia ácida es causada principalmente por óxidos de:', options: ['Carbono y silicio', 'Azufre y nitrógeno', 'Sodio y potasio', 'Hierro y aluminio'], correct: 2 },
        { videoId: 'bach_c2_q_v12', question: 'Para medir 25.0 mL de una disolución con precisión, se debe usar:', options: ['Un vaso de precipitados', 'Una probeta', 'Una pipeta aforada', 'Un matraz Erlenmeyer'], correct: 3 }
    ].map((q, i) => ({
        id: `quiz_bach_c2_q_${i}`,
        videoId: q.videoId,
        questions: [{ id: `q_bach_c2_q_${i}_1`, text: q.question, options: q.options, correctAnswerIndex: q.correct }]
    })),
    
    // --- 2º BACHILLERATO DE CIENCIAS: FÍSICA ---
    ...[
        { videoId: 'bach_c2_f_v1', question: 'Según la segunda ley de Newton, la fuerza es igual a:', options: ['masa / aceleración', 'masa * aceleración', 'distancia / tiempo', 'trabajo * tiempo'], correct: 2 },
        { videoId: 'bach_c2_f_v3', question: 'La fuerza gravitatoria entre dos masas es siempre:', options: ['Repulsiva', 'Atractiva', 'Nula', 'Depende de la distancia'], correct: 2 },
        { videoId: 'bach_c2_f_v4', question: 'Las órbitas de los planetas alrededor del Sol, según Kepler, son:', options: ['Circulares', 'Elípticas', 'Parabólicas', 'Hiperbólicas'], correct: 2 },
        { videoId: 'bach_c2_f_v5', question: 'El campo eléctrico creado por una carga positiva es:', options: ['Nulo', 'Hacia la carga (convergente)', 'Hacia afuera de la carga (divergente)', 'Circular'], correct: 3 },
        { videoId: 'bach_c2_f_v6', question: 'Una carga en movimiento en un campo magnético experimenta una fuerza (Lorentz) que es:', options: ['Paralela a la velocidad', 'Paralela al campo', 'Perpendicular a la velocidad y al campo', 'Nula'], correct: 3 },
        { videoId: 'bach_c2_f_v7', question: 'La ley de Faraday-Lenz describe el fenómeno de:', options: ['Gravitación', 'Campo eléctrico', 'Inducción electromagnética', 'Efecto fotoeléctrico'], correct: 3 },
        { videoId: 'bach_c2_f_v8', question: 'En un Movimiento Armónico Simple (MAS), la aceleración es máxima en:', options: ['El punto de equilibrio', 'Los extremos de la trayectoria', 'Cualquier punto', 'No hay aceleración'], correct: 2 },
        { videoId: 'bach_c2_f_v9', question: 'La velocidad de la luz en el vacío es:', options: ['Infinita', 'Variable', 'Aproximadamente 300,000 km/s', 'Menor que la del sonido'], correct: 3 },
        { videoId: 'bach_c2_f_v10', question: 'El fenómeno por el cual una onda se desvía al rodear un obstáculo se llama:', options: ['Reflexión', 'Refracción', 'Interferencia', 'Difracción'], correct: 4 },
        { videoId: 'bach_c2_f_v11', question: 'El sonido es una onda:', options: ['Transversal y electromagnética', 'Longitudinal y mecánica', 'Transversal y mecánica', 'Longitudinal y electromagnética'], correct: 2 },
        { videoId: 'bach_c2_f_v12', question: 'El efecto fotoeléctrico demuestra la naturaleza de la luz como:', options: ['Onda', 'Partícula (fotón)', 'Campo magnético', 'Sonido'], correct: 2 },
        { videoId: 'bach_c2_f_v13', question: 'La fisión nuclear es el proceso de:', options: ['Unir núcleos ligeros', 'Dividir un núcleo pesado', 'Emitir electrones', 'Emitir fotones'], correct: 2 },
        { videoId: 'bach_c2_f_v14', question: 'Según la relatividad especial, el tiempo para un observador en movimiento:', options: ['Se acelera', 'Se detiene', 'Transcurre más lentamente (dilatación)', 'Es absoluto'], correct: 3 },
        { videoId: 'bach_c2_f_v15', question: 'Una lente convergente hace que los rayos de luz paralelos:', options: ['Converjan en un punto (foco)', 'Diverjan', 'Se reflejen', 'No los afecta'], correct: 1 },
        { videoId: 'bach_c2_f_v17', question: 'La miopía se corrige con lentes:', options: ['Convergentes', 'Divergentes', 'Cilíndricas', 'Planas'], correct: 2 }
    ].map((q, i) => ({
        id: `quiz_bach_c2_f_${i}`,
        videoId: q.videoId,
        questions: [{ id: `q_bach_c2_f_${i}_1`, text: q.question, options: q.options, correctAnswerIndex: q.correct }]
    })),
    
    // --- 2º BACHILLERATO DE SOCIALES: MATEMÁTICAS CCSS II ---
    ...[
        { videoId: 'bach_s2_m_v10', question: 'El primer paso para resolver un problema de contexto real es:', options: ['Calcular', 'Identificar los datos y la incógnita', 'Dibujar un gráfico', 'Escribir la solución'], correct: 2 },
        { videoId: 'bach_s2_m_v11', question: 'El símbolo "∀" en matemáticas significa:', options: ['Existe', 'Pertenece', 'Para todo', 'Tal que'], correct: 3 },
        { videoId: 'bach_s2_m_v12', question: 'Modelizar una situación consiste en:', options: ['Resolverla directamente', 'Traducirla a lenguaje matemático', 'Ignorar los detalles', 'Hacer un resumen'], correct: 2 },
        { videoId: 'bach_s2_m_v13', question: 'Si el resultado de un problema es "-3 personas", la solución es:', options: ['-3', '3', '0', 'Incoherente o absurda'], correct: 4 },
        { videoId: 'bach_s2_m_v14', question: 'Una hoja de cálculo es una herramienta útil para:', options: ['Escribir texto', 'Organizar datos y hacer cálculos', 'Navegar por internet', 'Dibujar'], correct: 2 },
        { videoId: 'bach_s2_m_v1', question: 'El determinante de una matriz 2x2 [[a, b], [c, d]] es:', options: ['a*c - b*d', 'a*d - b*c', 'a*b - c*d', 'a+d - (b+c)'], correct: 2 },
        { videoId: 'bach_s2_m_v6', question: 'Un sistema de ecuaciones se puede representar en forma de:', options: ['Función', 'Matriz', 'Derivada', 'Límite'], correct: 2 },
        { videoId: 'bach_s2_m_v2', question: 'La región factible en un problema de programación lineal es:', options: ['Siempre un cuadrado', 'El área donde se cumplen las restricciones', 'La función objetivo', 'La solución óptima'], correct: 2 },
        { videoId: 'bach_s2_m_v3', question: 'El dominio de la función f(x) = log(x) es:', options: ['Todos los reales', 'x > 0', 'x < 0', 'x >= 0'], correct: 2 },
        { videoId: 'bach_s2_m_v4', question: 'Para encontrar el coste mínimo de una función de costes C(x), se debe:', options: ['Calcular C(0)', 'Derivar C(x) e igualar a cero', 'Integrar C(x)', 'Calcular el límite en infinito'], correct: 2 },
        { videoId: 'bach_s2_m_v7', question: 'La integral de la función de ingreso marginal I\'(x) representa:', options: ['El coste total', 'El beneficio total', 'El ingreso total', 'El ingreso medio'], correct: 3 },
        { videoId: 'bach_s2_m_v8', question: 'Si P(A|B) = P(A), los sucesos A y B son:', options: ['Dependientes', 'Incompatibles', 'Iguales', 'Independientes'], correct: 4 },
        { videoId: 'bach_s2_m_v9', question: 'En una distribución Binomial, los experimentos son:', options: ['Dependientes entre sí', 'Continuos', 'Independientes entre sí', 'Infinitos'], correct: 3 },
        { videoId: 'bach_s2_m_v5', question: 'Un intervalo de confianza nos da:', options: ['Una estimación puntual de un parámetro', 'Un rango de valores donde probablemente está un parámetro', 'La probabilidad de un suceso', 'El tamaño de la muestra'], correct: 2 }
    ].map((q, i) => ({
        id: `quiz_bach_s2_m_${i}`,
        videoId: q.videoId,
        questions: [{ id: `q_bach_s2_m_${i}_1`, text: q.question, options: q.options, correctAnswerIndex: q.correct }]
    })),
    
    // --- NUEVOS QUIZZES PARA SELECTIVIDAD ---
    
    // Math II - Madrid
    ...Array.from({ length: 12 }, (_, i) => 2014 + i).map(year => ({
        id: `quiz_ebau_m_mad_${year}`,
        videoId: `ebau_m_mad_${year}`,
        questions: [{
            id: `q_ebau_m_mad_${year}_1`,
            text: `¿Qué representa la primera derivada de una función en un punto?`,
            options: ["El área bajo la curva", "La pendiente de la recta tangente", "Un punto de inflexión", "La concavidad"],
            correctAnswerIndex: 2,
            explanation: "La primera derivada de una función en un punto es la pendiente de la recta tangente a la gráfica en ese punto, lo que indica el crecimiento o decrecimiento de la función."
        }]
    })),

    // Math II - Andalucía
    ...Array.from({ length: 12 }, (_, i) => 2014 + i).map(year => ({
        id: `quiz_ebau_m_and_${year}`,
        videoId: `ebau_m_and_${year}`,
        questions: [{
            id: `q_ebau_m_and_${year}_1`,
            text: `Dos planos en el espacio son paralelos si sus vectores normales son...`,
            options: ['Perpendiculares', 'Iguales', 'Proporcionales (paralelos)', 'El vector nulo'],
            correctAnswerIndex: 3,
            explanation: "La orientación de un plano viene dada por su vector normal. Si dos planos son paralelos, sus vectores normales también deben serlo, es decir, proporcionales."
        }]
    })),

    // Chemistry - Madrid
    ...Array.from({ length: 12 }, (_, i) => 2014 + i).map(year => ({
        id: `quiz_ebau_q_mad_${year}`,
        videoId: `ebau_q_mad_${year}`,
        questions: [{
            id: `q_ebau_q_mad_${year}_1`,
            text: `Una disolución acuosa con un pH de 11 se considera:`,
            options: ['Ácida', 'Neutra', 'Básica (alcalina)', 'Saturada'],
            correctAnswerIndex: 3,
            explanation: 'Una disolución es básica o alcalina si su pH es mayor que 7. Es ácida si es menor que 7 y neutra si es igual a 7.'
        }]
    })),

    // Physics - Madrid
    ...Array.from({ length: 12 }, (_, i) => 2014 + i).map(year => ({
        id: `quiz_ebau_f_mad_${year}`,
        videoId: `ebau_f_mad_${year}`,
        questions: [{
            id: `q_ebau_f_mad_${year}_1`,
            text: `El fenómeno que demuestra la naturaleza corpuscular (partícula) de la luz es:`,
            options: ['La difracción', 'La reflexión', 'El efecto fotoeléctrico', 'La refracción'],
            correctAnswerIndex: 3,
            explanation: "El efecto fotoeléctrico, explicado por Einstein, solo puede entenderse si la luz se comporta como un chorro de partículas (fotones) que arrancan electrones de un metal."
        }]
    })),

    // Math CCSS II - Madrid
    ...Array.from({ length: 12 }, (_, i) => 2014 + i).map(year => ({
        id: `quiz_ebau_mcss_mad_${year}`,
        videoId: `ebau_mcss_mad_${year}`,
        questions: [{
            id: `q_ebau_mcss_mad_${year}_1`,
            text: `¿En qué problema de programación lineal, ¿dónde se encuentra siempre la solución óptima (máximo o mínimo)?`,
            options: ["En el origen de coordenadas", "En el centro de la región factible", "En uno de los vértices de la región factible", "Fuera de la región factible"],
            correctAnswerIndex: 3,
            explanation: 'El teorema fundamental de la programación lineal establece que si existe una solución óptima, esta se encontrará en al menos uno de los vértices de la región factible.'
        }]
    })),
    {
        "id": "quiz_eso_m_3",
        "videoId": "eso_m_3",
        "questions": [
            {
                "id": "q_eso_m_3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Ecuaciones de Segundo Grado\"?",
                "options": [
                    "Ecuaciones de segundo grado",
                    "Análisis sintáctico avanzado",
                    "Física de partículas",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Ecuaciones de segundo grado\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_fyq_2",
        "videoId": "eso_4_fyq_2",
        "questions": [
            {
                "id": "q_eso_4_fyq_2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Cinemática: MRU y MRUA\"?",
                "options": [
                    "Biología molecular",
                    "La Revolución Francesa",
                    "Movimiento rectilíneo uniforme y acelerado (MRU y MRUA)",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Movimiento rectilíneo uniforme y acelerado (MRU y MRUA)\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_fyq_1",
        "videoId": "eso_fyq_1",
        "questions": [
            {
                "id": "q_eso_fyq_1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Leyes de Newton\"?",
                "options": [
                    "Leyes de Newton",
                    "Química orgánica",
                    "Cálculo de integrales",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Leyes de Newton\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b1_v1",
        "videoId": "eso_3_m_b1_v1",
        "questions": [
            {
                "id": "q_eso_3_m_b1_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Números Enteros, Fraccionarios y Decimales\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "La historia del Imperio Romano",
                    "Física de partículas",
                    "Números enteros, fraccionarios y decimales"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Números enteros, fraccionarios y decimales\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b1_v2",
        "videoId": "eso_3_m_b1_v2",
        "questions": [
            {
                "id": "q_eso_3_m_b1_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Potencias y Raíces\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Potencias y raíces cuadradas y cúbicas",
                    "La Revolución Francesa",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Potencias y raíces cuadradas y cúbicas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b1_v3",
        "videoId": "eso_3_m_b1_v3",
        "questions": [
            {
                "id": "q_eso_3_m_b1_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Notación Científica\"?",
                "options": [
                    "Notación científica",
                    "Cálculo de integrales",
                    "Biología molecular",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Notación científica\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b1_v4",
        "videoId": "eso_3_m_b1_v4",
        "questions": [
            {
                "id": "q_eso_3_m_b1_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Proporcionalidad\"?",
                "options": [
                    "Física de partículas",
                    "Análisis sintáctico avanzado",
                    "Proporcionalidad directa e inversa",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Proporcionalidad directa e inversa\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b1_v5",
        "videoId": "eso_3_m_b1_v5",
        "questions": [
            {
                "id": "q_eso_3_m_b1_v5_1",
                "text": "¿Cuál es el tema principal del vídeo \"Porcentajes e Interés\"?",
                "options": [
                    "Física de partículas",
                    "La Revolución Francesa",
                    "Porcentajes, interés simple y compuesto",
                    "Química orgánica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Porcentajes, interés simple y compuesto\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b1_v6",
        "videoId": "eso_3_m_b1_v6",
        "questions": [
            {
                "id": "q_eso_3_m_b1_v6_1",
                "text": "¿Cuál es el tema principal del vídeo \"Magnitudes y Unidades\"?",
                "options": [
                    "Física de partículas",
                    "Leyes de la termodinámica",
                    "La historia del Imperio Romano",
                    "Magnitudes, unidades y conversiones"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Magnitudes, unidades y conversiones\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b2_v1",
        "videoId": "eso_3_m_b2_v1",
        "questions": [
            {
                "id": "q_eso_3_m_b2_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Expresiones Algebraicas y Polinomios\"?",
                "options": [
                    "La Revolución Francesa",
                    "Expresiones algebraicas, monomios y polinomios",
                    "Leyes de la termodinámica",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Expresiones algebraicas, monomios y polinomios\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b2_v2",
        "videoId": "eso_3_m_b2_v2",
        "questions": [
            {
                "id": "q_eso_3_m_b2_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Productos Notables y Factorización\"?",
                "options": [
                    "Biología molecular",
                    "Productos notables y factorización",
                    "Leyes de la termodinámica",
                    "La Revolución Francesa"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Productos notables y factorización\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b2_v3",
        "videoId": "eso_3_m_b2_v3",
        "questions": [
            {
                "id": "q_eso_3_m_b2_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Ecuaciones de Primer Grado\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Física de partículas",
                    "Ecuaciones de primer grado",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Ecuaciones de primer grado\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b2_v4",
        "videoId": "eso_3_m_b2_v4",
        "questions": [
            {
                "id": "q_eso_3_m_b2_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Sistemas de Ecuaciones Lineales\"?",
                "options": [
                    "Física de partículas",
                    "Sistemas de ecuaciones lineales con dos incógnitas",
                    "La Revolución Francesa",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Sistemas de ecuaciones lineales con dos incógnitas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b2_v5",
        "videoId": "eso_3_m_b2_v5",
        "questions": [
            {
                "id": "q_eso_3_m_b2_v5_1",
                "text": "¿Cuál es el tema principal del vídeo \"Inecuaciones de Primer Grado\"?",
                "options": [
                    "Química orgánica",
                    "Inecuaciones de primer grado",
                    "Análisis sintáctico avanzado",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Inecuaciones de primer grado\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b3_v1",
        "videoId": "eso_3_m_b3_v1",
        "questions": [
            {
                "id": "q_eso_3_m_b3_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Figuras Planas y Propiedades\"?",
                "options": [
                    "Figuras planas",
                    "Leyes de la termodinámica",
                    "Análisis sintáctico avanzado",
                    "Química orgánica"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Figuras planas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b3_v2",
        "videoId": "eso_3_m_b3_v2",
        "questions": [
            {
                "id": "q_eso_3_m_b3_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Teorema de Pitágoras y Aplicaciones\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "La historia del Imperio Romano",
                    "Teorema de Pitágoras y aplicaciones",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Teorema de Pitágoras y aplicaciones\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b3_v3",
        "videoId": "eso_3_m_b3_v3",
        "questions": [
            {
                "id": "q_eso_3_m_b3_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Trigonometría Básica\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Leyes de la termodinámica",
                    "Trigonometría básica, seno, coseno, tangente",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Trigonometría básica, seno, coseno, tangente\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b3_v4",
        "videoId": "eso_3_m_b3_v4",
        "questions": [
            {
                "id": "q_eso_3_m_b3_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Cuerpos Geométricos, Áreas y Volúmenes\"?",
                "options": [
                    "Cuerpos geométricos, áreas y volúmenes",
                    "Biología molecular",
                    "La historia del Imperio Romano",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Cuerpos geométricos, áreas y volúmenes\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b3_v5",
        "videoId": "eso_3_m_b3_v5",
        "questions": [
            {
                "id": "q_eso_3_m_b3_v5_1",
                "text": "¿Cuál es el tema principal del vídeo \"Semejanza y Homotecia\"?",
                "options": [
                    "Química orgánica",
                    "Escalas, semejanza y homotecia",
                    "La Revolución Francesa",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Escalas, semejanza y homotecia\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b4_v1",
        "videoId": "eso_3_m_b4_v1",
        "questions": [
            {
                "id": "q_eso_3_m_b4_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Funciones Lineales y Afines\"?",
                "options": [
                    "Funciones lineales y afines",
                    "Física de partículas",
                    "Análisis sintáctico avanzado",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Funciones lineales y afines\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b4_v2",
        "videoId": "eso_3_m_b4_v2",
        "questions": [
            {
                "id": "q_eso_3_m_b4_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Funciones Cuadráticas\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "La historia del Imperio Romano",
                    "Física de partículas",
                    "Funciones cuadráticas, parábola"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Funciones cuadráticas, parábola\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b4_v3",
        "videoId": "eso_3_m_b4_v3",
        "questions": [
            {
                "id": "q_eso_3_m_b4_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Interpretación de Gráficas\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Interpretación de gráficas",
                    "Biología molecular",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Interpretación de gráficas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b5_v1",
        "videoId": "eso_3_m_b5_v1",
        "questions": [
            {
                "id": "q_eso_3_m_b5_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Tablas de Frecuencias y Gráficos\"?",
                "options": [
                    "Biología molecular",
                    "Tablas de frecuencias, diagramas de barras, histogramas",
                    "La historia del Imperio Romano",
                    "Cálculo de integrales"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Tablas de frecuencias, diagramas de barras, histogramas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b5_v2",
        "videoId": "eso_3_m_b5_v2",
        "questions": [
            {
                "id": "q_eso_3_m_b5_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Medidas de Centralización\"?",
                "options": [
                    "Química orgánica",
                    "Análisis sintáctico avanzado",
                    "Medidas de centralización: media, mediana y moda",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Medidas de centralización: media, mediana y moda\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b5_v3",
        "videoId": "eso_3_m_b5_v3",
        "questions": [
            {
                "id": "q_eso_3_m_b5_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Medidas de Dispersión\"?",
                "options": [
                    "Medidas de dispersión: rango, varianza y desviación típica",
                    "La Revolución Francesa",
                    "Cálculo de integrales",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Medidas de dispersión: rango, varianza y desviación típica\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b6_v1",
        "videoId": "eso_3_m_b6_v1",
        "questions": [
            {
                "id": "q_eso_3_m_b6_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Sucesos y Espacio Muestral\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "La historia del Imperio Romano",
                    "Experimentos aleatorios, espacio muestral y sucesos",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Experimentos aleatorios, espacio muestral y sucesos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b6_v2",
        "videoId": "eso_3_m_b6_v2",
        "questions": [
            {
                "id": "q_eso_3_m_b6_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Regla de Laplace\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Leyes de la termodinámica",
                    "La Revolución Francesa",
                    "Regla de Laplace"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Regla de Laplace\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_m_b6_v3",
        "videoId": "eso_3_m_b6_v3",
        "questions": [
            {
                "id": "q_eso_3_m_b6_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Probabilidad Compuesta\"?",
                "options": [
                    "Física de partículas",
                    "Leyes de la termodinámica",
                    "Análisis sintáctico avanzado",
                    "Probabilidad compuesta simple"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Probabilidad compuesta simple\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b1_v1",
        "videoId": "eso_3_fyq_b1_v1",
        "questions": [
            {
                "id": "q_eso_3_fyq_b1_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Método Científico y Magnitudes\"?",
                "options": [
                    "Cálculo de integrales",
                    "Método científico, magnitudes y unidades",
                    "La Revolución Francesa",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Método científico, magnitudes y unidades\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b1_v2",
        "videoId": "eso_3_fyq_b1_v2",
        "questions": [
            {
                "id": "q_eso_3_fyq_b1_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Trabajo en Laboratorio\"?",
                "options": [
                    "Normas de seguridad y material de laboratorio",
                    "Física de partículas",
                    "Química orgánica",
                    "Cálculo de integrales"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Normas de seguridad y material de laboratorio\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b2_v1",
        "videoId": "eso_3_fyq_b2_v1",
        "questions": [
            {
                "id": "q_eso_3_fyq_b2_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Propiedades y Estados de la Materia\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Propiedades de la materia, estados y modelo cinético-molecular",
                    "La Revolución Francesa",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Propiedades de la materia, estados y modelo cinético-molecular\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b2_v2",
        "videoId": "eso_3_fyq_b2_v2",
        "questions": [
            {
                "id": "q_eso_3_fyq_b2_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Sustancias Puras y Mezclas\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Física de partículas",
                    "Sustancias puras, mezclas y métodos de separación",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Sustancias puras, mezclas y métodos de separación\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b2_v3",
        "videoId": "eso_3_fyq_b2_v3",
        "questions": [
            {
                "id": "q_eso_3_fyq_b2_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Estructura Atómica y Enlaces\"?",
                "options": [
                    "Biología molecular",
                    "Análisis sintáctico avanzado",
                    "Estructura atómica y enlaces químicos",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Estructura atómica y enlaces químicos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b3_v1",
        "videoId": "eso_3_fyq_b3_v1",
        "questions": [
            {
                "id": "q_eso_3_fyq_b3_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Reacciones Químicas\"?",
                "options": [
                    "Física de partículas",
                    "La historia del Imperio Romano",
                    "Cambios físicos y químicos, reacciones químicas",
                    "La Revolución Francesa"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Cambios físicos y químicos, reacciones químicas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b3_v2",
        "videoId": "eso_3_fyq_b3_v2",
        "questions": [
            {
                "id": "q_eso_3_fyq_b3_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Ley de Conservación de la Masa\"?",
                "options": [
                    "Ley de conservación de la masa",
                    "Física de partículas",
                    "Química orgánica",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Ley de conservación de la masa\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b3_v3",
        "videoId": "eso_3_fyq_b3_v3",
        "questions": [
            {
                "id": "q_eso_3_fyq_b3_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Formulación y Nomenclatura Inorgánica\"?",
                "options": [
                    "Biología molecular",
                    "Física de partículas",
                    "Formulación y nomenclatura inorgánica",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Formulación y nomenclatura inorgánica\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b4_v1",
        "videoId": "eso_3_fyq_b4_v1",
        "questions": [
            {
                "id": "q_eso_3_fyq_b4_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Cinemática: MRU y MRUA\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Movimiento rectilíneo uniforme (MRU) y uniformemente acelerado (MRUA)",
                    "Leyes de la termodinámica",
                    "Química orgánica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Movimiento rectilíneo uniforme (MRU) y uniformemente acelerado (MRUA)\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b4_v2",
        "videoId": "eso_3_fyq_b4_v2",
        "questions": [
            {
                "id": "q_eso_3_fyq_b4_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Leyes de Newton\"?",
                "options": [
                    "Leyes de Newton",
                    "La Revolución Francesa",
                    "La historia del Imperio Romano",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Leyes de Newton\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b4_v3",
        "videoId": "eso_3_fyq_b4_v3",
        "questions": [
            {
                "id": "q_eso_3_fyq_b4_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Máquinas Simples\"?",
                "options": [
                    "La Revolución Francesa",
                    "Cálculo de integrales",
                    "Biología molecular",
                    "Máquinas simples"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Máquinas simples\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b5_v1",
        "videoId": "eso_3_fyq_b5_v1",
        "questions": [
            {
                "id": "q_eso_3_fyq_b5_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Tipos de Energía y Conservación\"?",
                "options": [
                    "Física de partículas",
                    "Biología molecular",
                    "Energía, tipos y conservación",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Energía, tipos y conservación\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b5_v2",
        "videoId": "eso_3_fyq_b5_v2",
        "questions": [
            {
                "id": "q_eso_3_fyq_b5_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Energía Térmica y Transferencia de Calor\"?",
                "options": [
                    "La Revolución Francesa",
                    "Física de partículas",
                    "Energía térmica, calor, temperatura y transferencia",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Energía térmica, calor, temperatura y transferencia\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b6_v1",
        "videoId": "eso_3_fyq_b6_v1",
        "questions": [
            {
                "id": "q_eso_3_fyq_b6_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Carga y Corriente Eléctrica\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "La Revolución Francesa",
                    "Carga eléctrica y corriente eléctrica",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Carga eléctrica y corriente eléctrica\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b6_v2",
        "videoId": "eso_3_fyq_b6_v2",
        "questions": [
            {
                "id": "q_eso_3_fyq_b6_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Ley de Ohm y Circuitos\"?",
                "options": [
                    "Física de partículas",
                    "Biología molecular",
                    "Leyes de la termodinámica",
                    "Ley de Ohm y circuitos eléctricos"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Ley de Ohm y circuitos eléctricos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_3_fyq_b6_v3",
        "videoId": "eso_3_fyq_b6_v3",
        "questions": [
            {
                "id": "q_eso_3_fyq_b6_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Potencia Eléctrica y Magnetismo\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Leyes de la termodinámica",
                    "Potencia eléctrica y magnetismo",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Potencia eléctrica y magnetismo\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v1",
        "videoId": "eso_4_ma_v1",
        "questions": [
            {
                "id": "q_eso_4_ma_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Números Reales y Notación Científica\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Física de partículas",
                    "Biología molecular",
                    "Números reales, propiedades, operaciones y notación científica"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Números reales, propiedades, operaciones y notación científica\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v2",
        "videoId": "eso_4_ma_v2",
        "questions": [
            {
                "id": "q_eso_4_ma_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Potencias, Raíces y Radicales\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Potencias, raíces y radicales",
                    "La historia del Imperio Romano",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Potencias, raíces y radicales\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v3",
        "videoId": "eso_4_ma_v3",
        "questions": [
            {
                "id": "q_eso_4_ma_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Polinomios y Fracciones Algebraicas\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Análisis sintáctico avanzado",
                    "Polinomios y fracciones algebraicas",
                    "Química orgánica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Polinomios y fracciones algebraicas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v4",
        "videoId": "eso_4_ma_v4",
        "questions": [
            {
                "id": "q_eso_4_ma_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Ecuaciones y Sistemas\"?",
                "options": [
                    "Ecuaciones de primer y segundo grado, y sistemas de ecuaciones lineales",
                    "Química orgánica",
                    "Análisis sintáctico avanzado",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Ecuaciones de primer y segundo grado, y sistemas de ecuaciones lineales\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v5",
        "videoId": "eso_4_ma_v5",
        "questions": [
            {
                "id": "q_eso_4_ma_v5_1",
                "text": "¿Cuál es el tema principal del vídeo \"Inecuaciones y Sistemas de Inecuaciones\"?",
                "options": [
                    "Química orgánica",
                    "Biología molecular",
                    "Física de partículas",
                    "Inecuaciones y sistemas de inecuaciones"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Inecuaciones y sistemas de inecuaciones\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v6",
        "videoId": "eso_4_ma_v6",
        "questions": [
            {
                "id": "q_eso_4_ma_v6_1",
                "text": "¿Cuál es el tema principal del vídeo \"Concepto de Función\"?",
                "options": [
                    "Concepto de función y formas de representación",
                    "Análisis sintáctico avanzado",
                    "Biología molecular",
                    "Cálculo de integrales"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Concepto de función y formas de representación\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v7",
        "videoId": "eso_4_ma_v7",
        "questions": [
            {
                "id": "q_eso_4_ma_v7_1",
                "text": "¿Cuál es el tema principal del vídeo \"Funciones Lineales, Afines y Cuadráticas\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "La historia del Imperio Romano",
                    "Análisis sintáctico avanzado",
                    "Funciones lineales, afines y cuadráticas"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Funciones lineales, afines y cuadráticas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v8",
        "videoId": "eso_4_ma_v8",
        "questions": [
            {
                "id": "q_eso_4_ma_v8_1",
                "text": "¿Cuál es el tema principal del vídeo \"Funciones Exponenciales y Logarítmicas\"?",
                "options": [
                    "Química orgánica",
                    "Física de partículas",
                    "Funciones exponenciales y logarítmicas",
                    "Cálculo de integrales"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Funciones exponenciales y logarítmicas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v9",
        "videoId": "eso_4_ma_v9",
        "questions": [
            {
                "id": "q_eso_4_ma_v9_1",
                "text": "¿Cuál es el tema principal del vídeo \"Composición y Función Inversa\"?",
                "options": [
                    "Funciones inversas y composición de funciones",
                    "La Revolución Francesa",
                    "Química orgánica",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Funciones inversas y composición de funciones\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v10",
        "videoId": "eso_4_ma_v10",
        "questions": [
            {
                "id": "q_eso_4_ma_v10_1",
                "text": "¿Cuál es el tema principal del vídeo \"Semejanza y Teorema de Pitágoras\"?",
                "options": [
                    "Cálculo de integrales",
                    "Semejanza de figuras y teorema de Pitágoras",
                    "Física de partículas",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Semejanza de figuras y teorema de Pitágoras\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v11",
        "videoId": "eso_4_ma_v11",
        "questions": [
            {
                "id": "q_eso_4_ma_v11_1",
                "text": "¿Cuál es el tema principal del vídeo \"Trigonometría en Triángulos Rectángulos\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "Trigonometría en triángulos rectángulos",
                    "Física de partículas",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Trigonometría en triángulos rectángulos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v12",
        "videoId": "eso_4_ma_v12",
        "questions": [
            {
                "id": "q_eso_4_ma_v12_1",
                "text": "¿Cuál es el tema principal del vídeo \"Resolución de Triángulos\"?",
                "options": [
                    "La Revolución Francesa",
                    "Cálculo de integrales",
                    "Resolución de triángulos",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Resolución de triángulos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v13",
        "videoId": "eso_4_ma_v13",
        "questions": [
            {
                "id": "q_eso_4_ma_v13_1",
                "text": "¿Cuál es el tema principal del vídeo \"Grados y Radianes\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "La Revolución Francesa",
                    "Física de partículas",
                    "Ángulos en grados y radianes"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Ángulos en grados y radianes\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v14",
        "videoId": "eso_4_ma_v14",
        "questions": [
            {
                "id": "q_eso_4_ma_v14_1",
                "text": "¿Cuál es el tema principal del vídeo \"Estadística Unidimensional\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Física de partículas",
                    "La historia del Imperio Romano",
                    "Estadística unidimensional: tablas, gráficos, media, mediana, moda, varianza y desviación típica"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Estadística unidimensional: tablas, gráficos, media, mediana, moda, varianza y desviación típica\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v15",
        "videoId": "eso_4_ma_v15",
        "questions": [
            {
                "id": "q_eso_4_ma_v15_1",
                "text": "¿Cuál es el tema principal del vídeo \"Estadística Bidimensional\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Estadística bidimensional: correlación y regresión lineal",
                    "Cálculo de integrales",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Estadística bidimensional: correlación y regresión lineal\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v16",
        "videoId": "eso_4_ma_v16",
        "questions": [
            {
                "id": "q_eso_4_ma_v16_1",
                "text": "¿Cuál es el tema principal del vídeo \"Combinatoria Básica\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "Combinatoria: permutaciones, variaciones y combinaciones",
                    "Biología molecular",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Combinatoria: permutaciones, variaciones y combinaciones\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_ma_v17",
        "videoId": "eso_4_ma_v17",
        "questions": [
            {
                "id": "q_eso_4_ma_v17_1",
                "text": "¿Cuál es el tema principal del vídeo \"Probabilidad Compuesta y Condicional\"?",
                "options": [
                    "La Revolución Francesa",
                    "La historia del Imperio Romano",
                    "Cálculo de integrales",
                    "Probabilidad compuesta y condicional"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Probabilidad compuesta y condicional\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v1",
        "videoId": "eso_4_mb_v1",
        "questions": [
            {
                "id": "q_eso_4_mb_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Números Reales y Notación Científica\"?",
                "options": [
                    "Números reales: operaciones, jerarquía y notación científica",
                    "Física de partículas",
                    "Leyes de la termodinámica",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Números reales: operaciones, jerarquía y notación científica\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v2",
        "videoId": "eso_4_mb_v2",
        "questions": [
            {
                "id": "q_eso_4_mb_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Potencias y Raíces\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Cálculo de integrales",
                    "Potencias y raíces",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Potencias y raíces\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v3",
        "videoId": "eso_4_mb_v3",
        "questions": [
            {
                "id": "q_eso_4_mb_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Porcentajes e Interés\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "Biología molecular",
                    "Análisis sintáctico avanzado",
                    "Porcentajes, interés simple y compuesto"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Porcentajes, interés simple y compuesto\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v4",
        "videoId": "eso_4_mb_v4",
        "questions": [
            {
                "id": "q_eso_4_mb_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Proporcionalidad, Escalas y Razones\"?",
                "options": [
                    "Biología molecular",
                    "Proporcionalidad directa e inversa, escalas y razones",
                    "Análisis sintáctico avanzado",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Proporcionalidad directa e inversa, escalas y razones\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v5",
        "videoId": "eso_4_mb_v5",
        "questions": [
            {
                "id": "q_eso_4_mb_v5_1",
                "text": "¿Cuál es el tema principal del vídeo \"Expresiones Algebraicas y Ecuaciones\"?",
                "options": [
                    "Química orgánica",
                    "Leyes de la termodinámica",
                    "Expresiones algebraicas, ecuaciones de primer y segundo grado",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Expresiones algebraicas, ecuaciones de primer y segundo grado\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v6",
        "videoId": "eso_4_mb_v6",
        "questions": [
            {
                "id": "q_eso_4_mb_v6_1",
                "text": "¿Cuál es el tema principal del vídeo \"Sistemas de Ecuaciones Lineales\"?",
                "options": [
                    "Sistemas de ecuaciones lineales con dos incógnitas",
                    "Química orgánica",
                    "Cálculo de integrales",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Sistemas de ecuaciones lineales con dos incógnitas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v7",
        "videoId": "eso_4_mb_v7",
        "questions": [
            {
                "id": "q_eso_4_mb_v7_1",
                "text": "¿Cuál es el tema principal del vídeo \"Resolución de Problemas Cotidianos\"?",
                "options": [
                    "Biología molecular",
                    "Resolución de problemas de la vida cotidiana",
                    "Leyes de la termodinámica",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Resolución de problemas de la vida cotidiana\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v8",
        "videoId": "eso_4_mb_v8",
        "questions": [
            {
                "id": "q_eso_4_mb_v8_1",
                "text": "¿Cuál es el tema principal del vídeo \"Funciones Lineales y Afines\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "Funciones lineales y afines",
                    "Química orgánica",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Funciones lineales y afines\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v9",
        "videoId": "eso_4_mb_v9",
        "questions": [
            {
                "id": "q_eso_4_mb_v9_1",
                "text": "¿Cuál es el tema principal del vídeo \"Funciones Cuadráticas\"?",
                "options": [
                    "Funciones cuadráticas, parábola",
                    "La historia del Imperio Romano",
                    "Biología molecular",
                    "Cálculo de integrales"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Funciones cuadráticas, parábola\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v10",
        "videoId": "eso_4_mb_v10",
        "questions": [
            {
                "id": "q_eso_4_mb_v10_1",
                "text": "¿Cuál es el tema principal del vídeo \"Interpretación de Gráficas Reales\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "Análisis sintáctico avanzado",
                    "Interpretación de gráficas en contextos reales",
                    "La Revolución Francesa"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Interpretación de gráficas en contextos reales\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v11",
        "videoId": "eso_4_mb_v11",
        "questions": [
            {
                "id": "q_eso_4_mb_v11_1",
                "text": "¿Cuál es el tema principal del vídeo \"Figuras Planas y Cuerpos Geométricos\"?",
                "options": [
                    "Cálculo de integrales",
                    "Física de partículas",
                    "Biología molecular",
                    "Figuras planas y cuerpos geométricos"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Figuras planas y cuerpos geométricos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v12",
        "videoId": "eso_4_mb_v12",
        "questions": [
            {
                "id": "q_eso_4_mb_v12_1",
                "text": "¿Cuál es el tema principal del vídeo \"Teorema de Pitágoras y Semejanza\"?",
                "options": [
                    "Teorema de Pitágoras y semejanza",
                    "La Revolución Francesa",
                    "Física de partículas",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Teorema de Pitágoras y semejanza\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v13",
        "videoId": "eso_4_mb_v13",
        "questions": [
            {
                "id": "q_eso_4_mb_v13_1",
                "text": "¿Cuál es el tema principal del vídeo \"Trigonometría Básica\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Trigonometría básica en triángulos rectángulos",
                    "Análisis sintáctico avanzado",
                    "Química orgánica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Trigonometría básica en triángulos rectángulos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v14",
        "videoId": "eso_4_mb_v14",
        "questions": [
            {
                "id": "q_eso_4_mb_v14_1",
                "text": "¿Cuál es el tema principal del vídeo \"Tablas, Gráficos y Medidas\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Tablas, gráficos, media, mediana, moda, rango y desviación típica",
                    "Biología molecular",
                    "Química orgánica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Tablas, gráficos, media, mediana, moda, rango y desviación típica\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_mb_v15",
        "videoId": "eso_4_mb_v15",
        "questions": [
            {
                "id": "q_eso_4_mb_v15_1",
                "text": "¿Cuál es el tema principal del vídeo \"Probabilidad Simple y Compuesta\"?",
                "options": [
                    "La Revolución Francesa",
                    "Análisis sintáctico avanzado",
                    "Probabilidad simple y compuesta, regla de Laplace",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Probabilidad simple y compuesta, regla de Laplace\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_fyq_v3",
        "videoId": "eso_4_fyq_v3",
        "questions": [
            {
                "id": "q_eso_4_fyq_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Fuerzas y Presión en Fluidos\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "Fuerzas y presión en fluidos, principio de Arquímedes",
                    "Análisis sintáctico avanzado",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Fuerzas y presión en fluidos, principio de Arquímedes\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_fyq_v4",
        "videoId": "eso_4_fyq_v4",
        "questions": [
            {
                "id": "q_eso_4_fyq_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Trabajo, Potencia y Energía\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Biología molecular",
                    "Trabajo, potencia y energía mecánica",
                    "Química orgánica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Trabajo, potencia y energía mecánica\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_fyq_v5",
        "videoId": "eso_4_fyq_v5",
        "questions": [
            {
                "id": "q_eso_4_fyq_v5_1",
                "text": "¿Cuál es el tema principal del vídeo \"Conservación de la Energía\"?",
                "options": [
                    "Cálculo de integrales",
                    "La historia del Imperio Romano",
                    "Leyes de la termodinámica",
                    "Conservación de la energía mecánica"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Conservación de la energía mecánica\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_fyq_v6",
        "videoId": "eso_4_fyq_v6",
        "questions": [
            {
                "id": "q_eso_4_fyq_v6_1",
                "text": "¿Cuál es el tema principal del vídeo \"Modelos Atómicos y Tabla Periódica\"?",
                "options": [
                    "La Revolución Francesa",
                    "Modelos atómicos, tabla periódica y propiedades",
                    "Física de partículas",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Modelos atómicos, tabla periódica y propiedades\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_fyq_v7",
        "videoId": "eso_4_fyq_v7",
        "questions": [
            {
                "id": "q_eso_4_fyq_v7_1",
                "text": "¿Cuál es el tema principal del vídeo \"Enlaces Químicos\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Enlaces químicos: iónico, covalente y metálico",
                    "La historia del Imperio Romano",
                    "Cálculo de integrales"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Enlaces químicos: iónico, covalente y metálico\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_fyq_v8",
        "videoId": "eso_4_fyq_v8",
        "questions": [
            {
                "id": "q_eso_4_fyq_v8_1",
                "text": "¿Cuál es el tema principal del vídeo \"El Mol y Cálculos Estequiométricos\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Cálculos estequiométricos y mol",
                    "La Revolución Francesa",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Cálculos estequiométricos y mol\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_fyq_v9",
        "videoId": "eso_4_fyq_v9",
        "questions": [
            {
                "id": "q_eso_4_fyq_v9_1",
                "text": "¿Cuál es el tema principal del vídeo \"Tipos de Reacciones Químicas\"?",
                "options": [
                    "Tipos de reacciones químicas",
                    "Biología molecular",
                    "La Revolución Francesa",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Tipos de reacciones químicas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_eso_4_fyq_v10",
        "videoId": "eso_4_fyq_v10",
        "questions": [
            {
                "id": "q_eso_4_fyq_v10_1",
                "text": "¿Cuál es el tema principal del vídeo \"Formulación y Nomenclatura Orgánica\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "La Revolución Francesa",
                    "Física de partículas",
                    "Química orgánica: alcanos, alquenos y alquinos"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Química orgánica: alcanos, alquenos y alquinos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v1",
        "videoId": "bach_s1_m_ccss_v1",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Tipos de variables y gráficos estadísticos\"?",
                "options": [
                    "Tipos de variables y gráficos estadísticos",
                    "Leyes de la termodinámica",
                    "La Revolución Francesa",
                    "Cálculo de integrales"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Tipos de variables y gráficos estadísticos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v2",
        "videoId": "bach_s1_m_ccss_v2",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Medidas de centralización: media, mediana, moda\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "Cálculo de integrales",
                    "La historia del Imperio Romano",
                    "Medidas de centralización"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Medidas de centralización\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v3",
        "videoId": "bach_s1_m_ccss_v3",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Medidas de dispersión: rango, desviación típica, varianza\"?",
                "options": [
                    "Biología molecular",
                    "Medidas de dispersión",
                    "La historia del Imperio Romano",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Medidas de dispersión\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v4",
        "videoId": "bach_s1_m_ccss_v4",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Distribuciones estadísticas y su interpretación\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "La Revolución Francesa",
                    "Biología molecular",
                    "Distribuciones estadísticas"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Distribuciones estadísticas\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v5",
        "videoId": "bach_s1_m_ccss_v5",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v5_1",
                "text": "¿Cuál es el tema principal del vídeo \"Expresiones algebraicas y operaciones\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Análisis sintáctico avanzado",
                    "Expresiones algebraicas y operaciones",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Expresiones algebraicas y operaciones\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v6",
        "videoId": "bach_s1_m_ccss_v6",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v6_1",
                "text": "¿Cuál es el tema principal del vídeo \"Ecuaciones de primer y segundo grado\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Análisis sintáctico avanzado",
                    "Leyes de la termodinámica",
                    "Ecuaciones de primer y segundo grado"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Ecuaciones de primer y segundo grado\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v7",
        "videoId": "bach_s1_m_ccss_v7",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v7_1",
                "text": "¿Cuál es el tema principal del vídeo \"Sistemas de ecuaciones lineales\"?",
                "options": [
                    "Sistemas de ecuaciones lineales",
                    "Física de partículas",
                    "Cálculo de integrales",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Sistemas de ecuaciones lineales\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v8",
        "videoId": "bach_s1_m_ccss_v8",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v8_1",
                "text": "¿Cuál es el tema principal del vídeo \"Funciones: concepto, dominio, recorrido\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "Concepto de función, dominio y recorrido",
                    "La Revolución Francesa",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Concepto de función, dominio y recorrido\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v9",
        "videoId": "bach_s1_m_ccss_v9",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v9_1",
                "text": "¿Cuál es el tema principal del vídeo \"Tipos de funciones: lineales, cuadráticas, exponenciales, logarítmicas\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Análisis sintáctico avanzado",
                    "Tipos de funciones elementales",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Tipos de funciones elementales\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v10",
        "videoId": "bach_s1_m_ccss_v10",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v10_1",
                "text": "¿Cuál es el tema principal del vídeo \"Representación gráfica y análisis de funciones\"?",
                "options": [
                    "Química orgánica",
                    "Leyes de la termodinámica",
                    "Representación gráfica y análisis de funciones",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Representación gráfica y análisis de funciones\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v11",
        "videoId": "bach_s1_m_ccss_v11",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v11_1",
                "text": "¿Cuál es el tema principal del vídeo \"Interés simple y compuesto\"?",
                "options": [
                    "Física de partículas",
                    "Interés simple y compuesto",
                    "Cálculo de integrales",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Interés simple y compuesto\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v12",
        "videoId": "bach_s1_m_ccss_v12",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v12_1",
                "text": "¿Cuál es el tema principal del vídeo \"Rentas y préstamos\"?",
                "options": [
                    "Rentas y préstamos",
                    "Leyes de la termodinámica",
                    "La Revolución Francesa",
                    "Cálculo de integrales"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Rentas y préstamos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v13",
        "videoId": "bach_s1_m_ccss_v13",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v13_1",
                "text": "¿Cuál es el tema principal del vídeo \"Valor actual y valor futuro\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "Análisis sintáctico avanzado",
                    "La Revolución Francesa",
                    "Valor actual y valor futuro"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Valor actual y valor futuro\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v14",
        "videoId": "bach_s1_m_ccss_v14",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v14_1",
                "text": "¿Cuál es el tema principal del vídeo \"Aplicaciones en economía y empresa\"?",
                "options": [
                    "Física de partículas",
                    "Cálculo de integrales",
                    "Aplicaciones de matemática financiera",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Aplicaciones de matemática financiera\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v15",
        "videoId": "bach_s1_m_ccss_v15",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v15_1",
                "text": "¿Cuál es el tema principal del vídeo \"Experimentos aleatorios y espacio muestral\"?",
                "options": [
                    "Química orgánica",
                    "La Revolución Francesa",
                    "Experimentos aleatorios y espacio muestral",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Experimentos aleatorios y espacio muestral\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v16",
        "videoId": "bach_s1_m_ccss_v16",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v16_1",
                "text": "¿Cuál es el tema principal del vídeo \"Probabilidad simple y compuesta\"?",
                "options": [
                    "Cálculo de integrales",
                    "Probabilidad simple y compuesta",
                    "Química orgánica",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Probabilidad simple y compuesta\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v17",
        "videoId": "bach_s1_m_ccss_v17",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v17_1",
                "text": "¿Cuál es el tema principal del vídeo \"Regla de Laplace\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Física de partículas",
                    "Regla de Laplace",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Regla de Laplace\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v18",
        "videoId": "bach_s1_m_ccss_v18",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v18_1",
                "text": "¿Cuál es el tema principal del vídeo \"Sucesos independientes y dependientes\"?",
                "options": [
                    "Química orgánica",
                    "La historia del Imperio Romano",
                    "Sucesos independientes y dependientes",
                    "La Revolución Francesa"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Sucesos independientes y dependientes\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v19",
        "videoId": "bach_s1_m_ccss_v19",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v19_1",
                "text": "¿Cuál es el tema principal del vídeo \"Diagramas de árbol y tablas de contingencia\"?",
                "options": [
                    "Diagramas de árbol y tablas de contingencia",
                    "Cálculo de integrales",
                    "La Revolución Francesa",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Diagramas de árbol y tablas de contingencia\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v20",
        "videoId": "bach_s1_m_ccss_v20",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v20_1",
                "text": "¿Cuál es el tema principal del vídeo \"Planteamiento de problemas reales\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "La historia del Imperio Romano",
                    "Planteamiento de problemas de programación lineal",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Planteamiento de problemas de programación lineal\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v21",
        "videoId": "bach_s1_m_ccss_v21",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v21_1",
                "text": "¿Cuál es el tema principal del vídeo \"Restricciones y función objetivo\"?",
                "options": [
                    "Biología molecular",
                    "Restricciones y función objetivo",
                    "La historia del Imperio Romano",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Restricciones y función objetivo\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_m_ccss_v22",
        "videoId": "bach_s1_m_ccss_v22",
        "questions": [
            {
                "id": "q_bach_s1_m_ccss_v22_1",
                "text": "¿Cuál es el tema principal del vídeo \"Resolución gráfica de problemas de optimización\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Resolución gráfica de problemas de optimización",
                    "La historia del Imperio Romano",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Resolución gráfica de problemas de optimización\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b1_v1",
        "videoId": "bach_s1_e_b1_v1",
        "questions": [
            {
                "id": "q_bach_s1_e_b1_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Qué es la economía y por qué es necesaria\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Concepto de economía",
                    "La historia del Imperio Romano",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Concepto de economía\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b1_v2",
        "videoId": "bach_s1_e_b1_v2",
        "questions": [
            {
                "id": "q_bach_s1_e_b1_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Escasez, coste de oportunidad y elección\"?",
                "options": [
                    "Escasez y coste de oportunidad",
                    "La Revolución Francesa",
                    "Biología molecular",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Escasez y coste de oportunidad\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b1_v3",
        "videoId": "bach_s1_e_b1_v3",
        "questions": [
            {
                "id": "q_bach_s1_e_b1_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Necesidades, bienes y servicios\"?",
                "options": [
                    "Cálculo de integrales",
                    "Necesidades, bienes y servicios",
                    "Leyes de la termodinámica",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Necesidades, bienes y servicios\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b1_v4",
        "videoId": "bach_s1_e_b1_v4",
        "questions": [
            {
                "id": "q_bach_s1_e_b1_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Factores de producción\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Factores de producción",
                    "La Revolución Francesa",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Factores de producción\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b2_v1",
        "videoId": "bach_s1_e_b2_v1",
        "questions": [
            {
                "id": "q_bach_s1_e_b2_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Proceso productivo y eficiencia\"?",
                "options": [
                    "La Revolución Francesa",
                    "Biología molecular",
                    "Proceso productivo y FPP",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Proceso productivo y FPP\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b2_v2",
        "videoId": "bach_s1_e_b2_v2",
        "questions": [
            {
                "id": "q_bach_s1_e_b2_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Productividad y tecnología\"?",
                "options": [
                    "Cálculo de integrales",
                    "Productividad y tecnología",
                    "Química orgánica",
                    "La Revolución Francesa"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Productividad y tecnología\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b2_v3",
        "videoId": "bach_s1_e_b2_v3",
        "questions": [
            {
                "id": "q_bach_s1_e_b2_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Crecimiento económico y desarrollo sostenible\"?",
                "options": [
                    "Cálculo de integrales",
                    "La historia del Imperio Romano",
                    "Análisis sintáctico avanzado",
                    "Crecimiento y desarrollo sostenible"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Crecimiento y desarrollo sostenible\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b2_v4",
        "videoId": "bach_s1_e_b2_v4",
        "questions": [
            {
                "id": "q_bach_s1_e_b2_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Indicadores económicos: PIB, renta per cápita, IDH\"?",
                "options": [
                    "Leyes de la termodinámica",
                    "La historia del Imperio Romano",
                    "Indicadores económicos",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Indicadores económicos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b3_v1",
        "videoId": "bach_s1_e_b3_v1",
        "questions": [
            {
                "id": "q_bach_s1_e_b3_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Familias, empresas y sector público\"?",
                "options": [
                    "Física de partículas",
                    "Leyes de la termodinámica",
                    "Agentes económicos",
                    "La Revolución Francesa"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Agentes económicos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b3_v2",
        "videoId": "bach_s1_e_b3_v2",
        "questions": [
            {
                "id": "q_bach_s1_e_b3_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Sistemas económicos: capitalismo, socialismo, economía mixta\"?",
                "options": [
                    "Sistemas económicos",
                    "Análisis sintáctico avanzado",
                    "La historia del Imperio Romano",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Sistemas económicos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b3_v3",
        "videoId": "bach_s1_e_b3_v3",
        "questions": [
            {
                "id": "q_bach_s1_e_b3_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Economía de mercado y planificación\"?",
                "options": [
                    "Economía de mercado y planificación",
                    "Biología molecular",
                    "Física de partículas",
                    "Análisis sintáctico avanzado"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Economía de mercado y planificación\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b4_v1",
        "videoId": "bach_s1_e_b4_v1",
        "questions": [
            {
                "id": "q_bach_s1_e_b4_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Tipos de empresa y su función económica\"?",
                "options": [
                    "Física de partículas",
                    "Leyes de la termodinámica",
                    "Análisis sintáctico avanzado",
                    "Tipos de empresa"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Tipos de empresa\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b4_v2",
        "videoId": "bach_s1_e_b4_v2",
        "questions": [
            {
                "id": "q_bach_s1_e_b4_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Organización interna y departamentos\"?",
                "options": [
                    "La Revolución Francesa",
                    "Análisis sintáctico avanzado",
                    "Organización de la empresa",
                    "Biología molecular"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Organización de la empresa\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b4_v3",
        "videoId": "bach_s1_e_b4_v3",
        "questions": [
            {
                "id": "q_bach_s1_e_b4_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Ciclo de explotación y rentabilidad\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Cálculo de integrales",
                    "Costes, ingresos y beneficios",
                    "La Revolución Francesa"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Costes, ingresos y beneficios\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b4_v4",
        "videoId": "bach_s1_e_b4_v4",
        "questions": [
            {
                "id": "q_bach_s1_e_b4_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Responsabilidad social corporativa (RSC)\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "La Revolución Francesa",
                    "Responsabilidad Social Corporativa (RSC)",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Responsabilidad Social Corporativa (RSC)\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b5_v1",
        "videoId": "bach_s1_e_b5_v1",
        "questions": [
            {
                "id": "q_bach_s1_e_b5_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Ley de la oferta y la demanda\"?",
                "options": [
                    "Cálculo de integrales",
                    "Análisis sintáctico avanzado",
                    "Oferta y demanda",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Oferta y demanda\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b5_v2",
        "videoId": "bach_s1_e_b5_v2",
        "questions": [
            {
                "id": "q_bach_s1_e_b5_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Formación de precios\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Equilibrio de mercado",
                    "La Revolución Francesa",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Equilibrio de mercado\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b5_v3",
        "videoId": "bach_s1_e_b5_v3",
        "questions": [
            {
                "id": "q_bach_s1_e_b5_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Competencia perfecta e imperfecta\"?",
                "options": [
                    "Competencia perfecta e imperfecta",
                    "Cálculo de integrales",
                    "La historia del Imperio Romano",
                    "Física de partículas"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Competencia perfecta e imperfecta\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b5_v4",
        "videoId": "bach_s1_e_b5_v4",
        "questions": [
            {
                "id": "q_bach_s1_e_b5_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Fallos del mercado y regulación\"?",
                "options": [
                    "Fallos del mercado",
                    "Biología molecular",
                    "La Revolución Francesa",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Fallos del mercado\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b6_v1",
        "videoId": "bach_s1_e_b6_v1",
        "questions": [
            {
                "id": "q_bach_s1_e_b6_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Monopolio, oligopolio y competencia monopolística\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Monopolio, oligopolio, competencia monopolística",
                    "Cálculo de integrales",
                    "La Revolución Francesa"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Monopolio, oligopolio, competencia monopolística\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b6_v2",
        "videoId": "bach_s1_e_b6_v2",
        "questions": [
            {
                "id": "q_bach_s1_e_b6_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Estrategias de marketing\"?",
                "options": [
                    "Cálculo de integrales",
                    "Análisis sintáctico avanzado",
                    "La Revolución Francesa",
                    "Estrategias de marketing"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Estrategias de marketing\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b6_v3",
        "videoId": "bach_s1_e_b6_v3",
        "questions": [
            {
                "id": "q_bach_s1_e_b6_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Publicidad y comportamiento del consumidor\"?",
                "options": [
                    "La Revolución Francesa",
                    "Publicidad y consumidor",
                    "La historia del Imperio Romano",
                    "Cálculo de integrales"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Publicidad y consumidor\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b7_v1",
        "videoId": "bach_s1_e_b7_v1",
        "questions": [
            {
                "id": "q_bach_s1_e_b7_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Funciones del dinero\"?",
                "options": [
                    "Biología molecular",
                    "La Revolución Francesa",
                    "Física de partículas",
                    "Funciones del dinero"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Funciones del dinero\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b7_v2",
        "videoId": "bach_s1_e_b7_v2",
        "questions": [
            {
                "id": "q_bach_s1_e_b7_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Bancos y entidades financieras\"?",
                "options": [
                    "La historia del Imperio Romano",
                    "Análisis sintáctico avanzado",
                    "Leyes de la termodinámica",
                    "Sistema financiero"
                ],
                "correctAnswerIndex": 4,
                "explanation": "El vídeo trata sobre \"Sistema financiero\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b7_v3",
        "videoId": "bach_s1_e_b7_v3",
        "questions": [
            {
                "id": "q_bach_s1_e_b7_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Banco Central y política monetaria\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Biología molecular",
                    "Política monetaria",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Política monetaria\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b7_v4",
        "videoId": "bach_s1_e_b7_v4",
        "questions": [
            {
                "id": "q_bach_s1_e_b7_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Inflación y tipos de interés\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Leyes de la termodinámica",
                    "Inflación y tipos de interés",
                    "Cálculo de integrales"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Inflación y tipos de interés\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b8_v1",
        "videoId": "bach_s1_e_b8_v1",
        "questions": [
            {
                "id": "q_bach_s1_e_b8_v1_1",
                "text": "¿Cuál es el tema principal del vídeo \"Ingresos y gastos públicos\"?",
                "options": [
                    "Análisis sintáctico avanzado",
                    "Ingresos y gastos públicos",
                    "Biología molecular",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Ingresos y gastos públicos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b8_v2",
        "videoId": "bach_s1_e_b8_v2",
        "questions": [
            {
                "id": "q_bach_s1_e_b8_v2_1",
                "text": "¿Cuál es el tema principal del vídeo \"Impuestos: directos e indirectos\"?",
                "options": [
                    "Física de partículas",
                    "Impuestos directos e indirectos",
                    "Análisis sintáctico avanzado",
                    "La historia del Imperio Romano"
                ],
                "correctAnswerIndex": 2,
                "explanation": "El vídeo trata sobre \"Impuestos directos e indirectos\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b8_v3",
        "videoId": "bach_s1_e_b8_v3",
        "questions": [
            {
                "id": "q_bach_s1_e_b8_v3_1",
                "text": "¿Cuál es el tema principal del vídeo \"Déficit público y deuda\"?",
                "options": [
                    "Déficit y deuda pública",
                    "Física de partículas",
                    "Cálculo de integrales",
                    "La Revolución Francesa"
                ],
                "correctAnswerIndex": 1,
                "explanation": "El vídeo trata sobre \"Déficit y deuda pública\", que es el concepto clave presentado."
            }
        ]
    },
    {
        "id": "quiz_bach_s1_e_b8_v4",
        "videoId": "bach_s1_e_b8_v4",
        "questions": [
            {
                "id": "q_bach_s1_e_b8_v4_1",
                "text": "¿Cuál es el tema principal del vídeo \"Redistribución de la renta\"?",
                "options": [
                    "Cálculo de integrales",
                    "Análisis sintáctico avanzado",
                    "Redistribución de la renta",
                    "Leyes de la termodinámica"
                ],
                "correctAnswerIndex": 3,
                "explanation": "El vídeo trata sobre \"Redistribución de la renta\", que es el concepto clave presentado."
            }
        ]
    }
];
