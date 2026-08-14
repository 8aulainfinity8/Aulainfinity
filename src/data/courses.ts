// This file acts as a static data source for all courses.
// In a real application, this would likely be fetched from a database.

import type { CourseLevel } from '../types';

export const coursesData: CourseLevel[] = [
    // --- 1º E.S.O. ---
    {
        id: 'eso_1',
        name: '1º E.S.O.',
        createdAt: '2024-01-10T10:00:00Z',
        subjects: [
            {
                id: 'eso_1_matematicas',
                name: 'Matemáticas',
                icon: 'MathIcon',
                createdAt: '2024-01-10T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'eso_1_m_b1', name: '1. Números y Operaciones', videos: [
                            { id: 'eso1_m_1', title: 'Números Naturales y Divisibilidad', description: 'Repaso de números naturales, factores y múltiplos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'buuFf2_5-d4' }], topic: 'Divisibilidad y números naturales', createdAt: '2024-01-11T10:00:00Z', page: 10 },
                            { id: 'eso1_m_2', title: 'Fracciones y su representación', description: 'Concepto de fracción, equivalencia y simplificación.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '2yfkEAt2ew0' }], topic: 'Fracciones', createdAt: '2024-01-12T10:00:00Z', page: 22 },
                            { id: 'eso1_m_3', title: 'Operaciones con Decimales', description: 'Suma, resta, multiplicación y división de números decimales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'v8wBCX_t-c' }], topic: 'Decimales', createdAt: '2024-01-13T10:00:00Z', page: 34 }
                        ]
                    },
                    {
                        id: 'eso_1_m_b2', name: '2. Introducción al Álgebra', videos: [
                            { id: 'eso1_m_4', title: 'Lenguaje Algebraico', description: 'Cómo traducir del lenguaje común al lenguaje matemático.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '3TTKDr6n2m' }], topic: 'Variables y expresiones', createdAt: '2024-01-14T10:00:00Z', page: 48 },
                            { id: 'eso1_m_5', title: 'Ecuaciones Sencillas de Primer Grado', description: 'Resolución paso a paso de ecuaciones lineales simples.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'B-d_94-i_xg' }], topic: 'Ecuaciones de primer grado', createdAt: '2024-01-15T10:00:00Z', page: 55 }
                        ]
                    }
                ]
            },
            {
                id: 'eso_1_biologia_geologia',
                name: 'Biología y Geología',
                icon: 'PhysicsIcon',
                createdAt: '2024-01-10T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'eso_1_bg_b1', name: '1. Nuestro planeta en el Universo', videos: [
                            { id: 'eso1_bg_1', title: 'La Tierra en el Sistema Solar', description: 'Características generales de la Tierra y sus movimientos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'z-9g-1y0-I' }], topic: 'Sistema solar y la Tierra', createdAt: '2024-02-01T10:00:00Z', page: 12 },
                            { id: 'eso1_bg_2', title: 'La Capas de la Tierra', description: 'Atmósfera, hidrosfera, geosfera y biosfera.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'p-s92O8v2kI' }], topic: 'Capas terrestres', createdAt: '2024-02-02T10:00:00Z', page: 20 }
                        ]
                    }
                ]
            }
        ]
    },
    // --- 2º E.S.O. ---
    {
        id: 'eso_2',
        name: '2º E.S.O.',
        createdAt: '2024-01-10T10:00:00Z',
        subjects: [
            {
                id: 'eso_2_matematicas',
                name: 'Matemáticas',
                icon: 'MathIcon',
                createdAt: '2024-01-10T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'eso_2_m_b1', name: '1. Números y Álgebra', videos: [
                            { id: 'eso_m_1', title: 'Números Enteros, Fracciones y Decimales', description: 'Operaciones básicas y propiedades.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'buuFf2_5-d4' }], topic: 'Operaciones con números naturales, enteros, fracciones y decimales', createdAt: '2024-01-11T10:00:00Z', page: 12 },
                            { id: 'eso_m_p1', title: 'Potencias y Raíces Cuadradas', description: 'Propiedades de las potencias y cálculo de raíces.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '2yfkEAt2ew0' }], topic: 'Potencias y raíces cuadradas', createdAt: '2024-01-12T10:00:00Z', page: 18 },
                            { id: 'eso_m_p2', title: 'Divisibilidad, MCD y mcm', description: 'Criterios de divisibilidad y cálculo del máximo común divisor y mínimo común múltiplo.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'v8wBCX_t-c' }], topic: 'Criterios de divisibilidad, MCD y mcm', createdAt: '2024-01-13T10:00:00Z', page: 25 },
                            { id: 'eso_m_p3', title: 'Expresiones Algebraicas y Polinomios', description: 'Introducción a monomios, polinomios y operaciones básicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '3TTKDr6n2m' }], topic: 'Expresiones algebraicas: monomios y polinomios', createdAt: '2024-01-14T10:00:00Z', page: 31 },
                            { id: 'eso_m_p4', title: 'Productos Notables', description: 'Cuadrado de una suma, cuadrado de una diferencia y suma por diferencia.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'Y-ac6i2-4_g' }], topic: 'Productos notables', createdAt: '2024-01-15T10:00:00Z', page: 35 },
                            { id: 'eso_m_p5', title: 'Ecuaciones de Primer Grado', description: 'Resolución de ecuaciones de primer grado y sistemas sencillos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'B-d_94-i_xg' }], topic: 'Ecuaciones de primer grado y sistemas sencillos', createdAt: '2024-01-16T10:00:00Z', page: 40 },
                            { id: 'eso_m_p6', title: 'Proporcionalidad y Porcentajes', description: 'Proporcionalidad directa e inversa, porcentajes e interés simple.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'ul_5h-wEa0M' }], topic: 'Proporcionalidad directa e inversa, porcentajes e interés simple', createdAt: '2024-01-17T10:00:00Z', page: 46 },
                        ]
                    },
                    {
                        id: 'eso_2_m_b2', name: '2. Geometría', videos: [
                            { id: 'eso_g_1', title: 'Ángulos y Rectas', description: 'Tipos de ángulos, relaciones, paralelismo y perpendicularidad.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'f_hIu3L-I0' }], topic: 'Ángulos: tipos y relaciones. Paralelismo y perpendicularidad', createdAt: '2024-01-18T10:00:00Z', page: 55 },
                            { id: 'eso_g_2', title: 'Triángulos y Cuadriláteros', description: 'Propiedades, clasificación y construcción.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'CRb50i1O0w' }], topic: 'Triángulos y cuadriláteros: propiedades y clasificación', createdAt: '2024-01-19T10:00:00Z', page: 62 },
                            { id: 'eso_g_3', title: 'Teorema de Pitágoras', description: 'Entiende y aplica el teorema de Pitágoras en problemas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '2yfkEAt2ew0' }], topic: 'Teorema de Pitágoras y aplicaciones', createdAt: '2024-01-20T10:00:00Z', page: 68 },
                            { id: 'eso_g_4', title: 'Semejanza y Teorema de Tales', description: 'Figuras semejantes y aplicaciones del Teorema de Tales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'JpW-A-GRgE' }], topic: 'Semejanza de figuras', createdAt: '2024-01-21T10:00:00Z', page: 73 },
                            { id: 'eso_g_5', title: 'Cuerpos Geométricos', description: 'Prismas, pirámides, cilindros, conos y esferas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '6-8o4o8p_4' }], topic: 'Cuerpos geométricos: prismas, pirámides, cilindros, conos y esferas', createdAt: '2024-01-22T10:00:00Z', page: 79 },
                            { id: 'eso_g_6', title: 'Áreas y Volúmenes', description: 'Cálculo de áreas de figuras planas y volúmenes de cuerpos geométricos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '4sJLp_gXg8' }], topic: 'Cálculo de áreas y volúmenes', createdAt: '2024-01-23T10:00:00Z', page: 85 },
                        ]
                    },
                    {
                        id: 'eso_2_m_b3', name: '3. Funciones y Gráficas', videos: [
                            { id: 'eso_f_1', title: 'Coordenadas Cartesianas y Funciones', description: 'Representación de puntos, rectas y concepto de función.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'H407s7W44A' }], topic: 'Sistema de coordenadas cartesianas. Representación de puntos y rectas. Concepto de función', createdAt: '2024-01-24T10:00:00Z', page: 92 },
                            { id: 'eso_f_2', title: 'Interpretación de Gráficas', description: 'Análisis e interpretación de gráficas y tablas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'F16gA6n2Uo' }], topic: 'Interpretación de gráficas y tablas', createdAt: '2024-01-25T10:00:00Z', page: 98 },
                            { id: 'eso_f_3', title: 'Funciones Lineales', description: 'Estudio y representación de funciones lineales y de proporcionalidad.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'PD45s3U-dI' }], topic: 'Funciones lineales y proporcionales', createdAt: '2024-01-26T10:00:00Z', page: 104 },
                        ]
                    },
                    {
                        id: 'eso_2_m_b4', name: '4. Estadística', videos: [
                            { id: 'eso_e_1', title: 'Tablas de Frecuencias y Gráficos', description: 'Organización de datos y construcción de diagramas de barras, histogramas, etc.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '6-8o4o8p_4' }], topic: 'Recogida y organización de datos. Tablas de frecuencias. Diagramas de barras, histogramas y polígonos de frecuencias', createdAt: '2024-01-27T10:00:00Z', page: 110 },
                            { id: 'eso_e_2', title: 'Medidas de Centralización', description: 'Cálculo de media, mediana y moda.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'oH3hTV53T-Y' }], topic: 'Medidas de centralización: media, mediana y moda', createdAt: '2024-01-28T10:00:00Z', page: 115 },
                        ]
                    },
                    {
                        id: 'eso_2_m_b5', name: '5. Probabilidad', videos: [
                            { id: 'eso_p_1', title: 'Sucesos y Probabilidad Simple', description: 'Experimentos aleatorios, espacio muestral y cálculo de probabilidades simples.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '9xIs_2n_l-g' }], topic: 'Experimentos aleatorios y deterministas. Sucesos y espacio muestral. Cálculo de probabilidades simples', createdAt: '2024-01-29T10:00:00Z', page: 121 },
                        ]
                    }
                ]
            },
            {
                id: 'eso_2_fisica_quimica',
                name: 'Física y Química',
                icon: 'PhysicsIcon',
                createdAt: '2024-01-10T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'eso_2_fyq_b1', name: '1. La actividad científica', videos: [
                            { id: 'fyq_ac_1', title: 'El Método Científico', description: 'Pasos del método científico: observación, hipótesis, experimentación y conclusiones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'z-9g-1y0-I' }], topic: 'Método científico', createdAt: '2024-02-01T10:00:00Z', page: 12 },
                            { id: 'fyq_ac_2', title: 'Magnitudes y Unidades (SI)', description: 'Magnitudes fundamentales y derivadas, Sistema Internacional y factores de conversión.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'p-s92O8v2kI' }], topic: 'Magnitudes físicas, Sistema Internacional de Unidades (SI), notación científica y factores de conversión', createdAt: '2024-02-02T10:00:00Z', page: 16 },
                        ]
                    },
                    {
                        id: 'eso_2_fyq_b2', name: '2. La materia', videos: [
                            { id: 'fyq_m_1', title: 'Propiedades y Estados de la Materia', description: 'Propiedades, estados de agregación y cambios de estado.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '1ZEP-8H3G0k' }], topic: 'Propiedades de la materia, estados de agregación y cambios de estado', createdAt: '2024-02-03T10:00:00Z', page: 22 },
                            { id: 'fyq_m_2', title: 'Densidad y Separación de Mezclas', description: 'Cálculo de densidad y métodos de separación como filtración y decantación.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '5eOB2aL_3cE' }], topic: 'Densidad, mezclas y sustancias puras, métodos de separación de mezclas', createdAt: '2024-02-04T10:00:00Z', page: 28 },
                        ]
                    },
                    {
                        id: 'eso_2_fyq_b3', name: '3. Estructura de la materia', videos: [
                            { id: 'fyq_em_1', title: 'Modelos Atómicos y Partículas', description: 'Modelo atómico básico y partículas subatómicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'tSEaGWSGjP8' }], topic: 'Modelo atómico, protones, neutrones y electrones', createdAt: '2024-02-05T10:00:00Z', page: 35 },
                            { id: 'fyq_em_2', title: 'Tabla Periódica y Formulación', description: 'Elementos, tabla periódica y formulación básica de óxidos, hidruros y sales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '7DBhBDr022Q' }], topic: 'Elementos químicos, tabla periódica, moléculas, formulación y nomenclatura básica', createdAt: '2024-02-06T10:00:00Z', page: 41 },
                        ]
                    },
                    {
                        id: 'eso_2_fyq_b4', name: '4. Cambios en la materia', videos: [
                            { id: 'fyq_cm_1', title: 'Reacciones Químicas', description: 'Cambios físicos y químicos, ecuaciones químicas y ley de Lavoisier.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'B-d_94-i_xg' }], topic: 'Cambios físicos y químicos, reacciones químicas y ley de conservación de la masa', createdAt: '2024-02-07T10:00:00Z', page: 48 },
                        ]
                    },
                    {
                        id: 'eso_2_fyq_b5', name: '5. El movimiento y las fuerzas', videos: [
                            { id: 'fyq_mf_1', title: 'Cinemática: MRU y MRUA', description: 'Conceptos de posición, velocidad, aceleración y gráficas de movimiento.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '1ZEP-8H3G0k' }], topic: 'Movimiento rectilíneo uniforme (MRU) y uniformemente acelerado (MRUA)', createdAt: '2024-02-08T10:00:00Z', page: 55 },
                            { id: 'fyq_mf_2', title: 'Las Leyes de Newton', description: 'Concepto de fuerza, tipos y las tres leyes de Newton.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'p-s92O8v2kI' }], topic: 'Fuerzas y Leyes de Newton', createdAt: '2024-02-09T10:00:00Z', page: 60 },
                        ]
                    },
                    {
                        id: 'eso_2_fyq_b6', name: '6. Energía', videos: [
                            { id: 'fyq_e_1', title: 'Formas y Conservación de la Energía', description: 'Concepto, formas de energía, transformaciones y principio de conservación.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'GG_40LrtjDE' }], topic: 'Concepto y formas de energía, principio de conservación', createdAt: '2024-02-10T10:00:00Z', page: 68 },
                            { id: 'fyq_e_2', title: 'Energía Cinética y Potencial', description: 'Cálculo de la energía cinética y potencial.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'AunqG6pS5Vo' }], topic: 'Energía cinética y potencial', createdAt: '2024-02-11T10:00:00Z', page: 74 },
                        ]
                    },
                    {
                        id: 'eso_2_fyq_b7', name: '7. Introducción a la termodinámica', videos: [
                            { id: 'fyq_t_1', title: 'Temperatura, Calor y Transferencia', description: 'Diferencia entre temperatura y calor, y mecanismos de transferencia.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'n_i3hMIbA4Y' }], topic: 'Temperatura, calor, conducción, convección y radiación', createdAt: '2024-02-12T10:00:00Z', page: 80 },
                        ]
                    }
                ]
            }
        ]
    },
    // --- 3º E.S.O. ---
    {
        id: 'eso_3',
        name: '3º E.S.O.',
        createdAt: '2024-01-10T10:00:00Z',
        subjects: [
            {
                id: 'eso_3_matematicas',
                name: 'Matemáticas',
                icon: 'MathIcon',
                createdAt: '2024-01-10T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'eso_3_m_b1', name: '1. Aritmética', videos: [
                            { id: 'eso_3_m_b1_v1', title: 'Números Enteros, Fraccionarios y Decimales', description: 'Operaciones y propiedades de los diferentes conjuntos numéricos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Números enteros, fraccionarios y decimales', createdAt: '2024-08-01T10:00:00Z', page: 10 },
                            { id: 'eso_3_m_b1_v2', title: 'Potencias y Raíces', description: 'Cálculo con potencias y raíces cuadradas y cúbicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Potencias y raíces cuadradas y cúbicas', createdAt: '2024-08-02T10:00:00Z', page: 15 },
                            { id: 'eso_3_m_b1_v3', title: 'Notación Científica', description: 'Uso de la notación científica y operaciones con la calculadora.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Notación científica', createdAt: '2024-08-03T10:00:00Z', page: 20 },
                            { id: 'eso_3_m_b1_v4', title: 'Proporcionalidad', description: 'Proporcionalidad directa e inversa y sus aplicaciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Proporcionalidad directa e inversa', createdAt: '2024-08-04T10:00:00Z', page: 25 },
                            { id: 'eso_3_m_b1_v5', title: 'Porcentajes e Interés', description: 'Cálculo de porcentajes, interés simple y compuesto.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Porcentajes, interés simple y compuesto', createdAt: '2024-08-05T10:00:00Z', page: 30 },
                            { id: 'eso_3_m_b1_v6', title: 'Magnitudes y Unidades', description: 'Conversiones de unidades y uso de escalas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Magnitudes, unidades y conversiones', createdAt: '2024-08-06T10:00:00Z', page: 35 },
                        ]
                    },
                    {
                        id: 'eso_3_m_b2', name: '2. Álgebra', videos: [
                            { id: 'eso_3_m_b2_v1', title: 'Expresiones Algebraicas y Polinomios', description: 'Operaciones con monomios y polinomios.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Expresiones algebraicas, monomios y polinomios', createdAt: '2024-08-07T10:00:00Z', page: 42 },
                            { id: 'eso_3_m_b2_v2', title: 'Productos Notables y Factorización', description: 'Identidades notables y cómo factorizar expresiones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Productos notables y factorización', createdAt: '2024-08-08T10:00:00Z', page: 48 },
                            { id: 'eso_3_m_b2_v3', title: 'Ecuaciones de Primer Grado', description: 'Resolución de ecuaciones de primer grado y problemas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ecuaciones de primer grado', createdAt: '2024-08-09T10:00:00Z', page: 54 },
                            { id: 'eso_m_3', title: 'Ecuaciones de Segundo Grado', description: 'Resolución de ecuaciones completas e incompletas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'B-d_94-i_xg' }], topic: 'Ecuaciones de segundo grado', createdAt: '2024-02-10T10:00:00Z', page: 60 },
                            { id: 'eso_3_m_b2_v4', title: 'Sistemas de Ecuaciones Lineales', description: 'Resolución de sistemas con dos incógnitas por sustitución, igualación y reducción.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Sistemas de ecuaciones lineales con dos incógnitas', createdAt: '2024-08-10T10:00:00Z', page: 65 },
                            { id: 'eso_3_m_b2_v5', title: 'Inecuaciones de Primer Grado', description: 'Resolución de inecuaciones y representación de soluciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Inecuaciones de primer grado', createdAt: '2024-08-11T10:00:00Z', page: 70 },
                        ]
                    },
                    {
                        id: 'eso_3_m_b3', name: '3. Geometría', videos: [
                            { id: 'eso_3_m_b3_v1', title: 'Figuras Planas y Propiedades', description: 'Clasificación y propiedades de las figuras planas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Figuras planas', createdAt: '2024-08-12T10:00:00Z', page: 80 },
                            { id: 'eso_3_m_b3_v2', title: 'Teorema de Pitágoras y Aplicaciones', description: 'Aplicación del Teorema de Pitágoras a problemas geométricos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Teorema de Pitágoras y aplicaciones', createdAt: '2024-08-13T10:00:00Z', page: 86 },
                            { id: 'eso_3_m_b3_v3', title: 'Trigonometría Básica', description: 'Razones trigonométricas en triángulos rectángulos: seno, coseno y tangente.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Trigonometría básica, seno, coseno, tangente', createdAt: '2024-08-14T10:00:00Z', page: 92 },
                            { id: 'eso_3_m_b3_v4', title: 'Cuerpos Geométricos, Áreas y Volúmenes', description: 'Cálculo de áreas y volúmenes de prismas, pirámides, cilindros, conos y esferas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Cuerpos geométricos, áreas y volúmenes', createdAt: '2024-08-15T10:00:00Z', page: 98 },
                            { id: 'eso_3_m_b3_v5', title: 'Semejanza y Homotecia', description: 'Aplicaciones de escalas, semejanza y homotecia.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Escalas, semejanza y homotecia', createdAt: '2024-08-16T10:00:00Z', page: 105 },
                        ]
                    },
                    {
                        id: 'eso_3_m_b4', name: '4. Funciones', videos: [
                            { id: 'eso_3_m_b4_v1', title: 'Funciones Lineales y Afines', description: 'Representación y estudio de la pendiente e intersecciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Funciones lineales y afines', createdAt: '2024-08-17T10:00:00Z', page: 112 },
                            { id: 'eso_3_m_b4_v2', title: 'Funciones Cuadráticas', description: 'La parábola, su vértice y propiedades.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Funciones cuadráticas, parábola', createdAt: '2024-08-18T10:00:00Z', page: 118 },
                            { id: 'eso_3_m_b4_v3', title: 'Interpretación de Gráficas', description: 'Análisis e interpretación de gráficas y tablas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Interpretación de gráficas', createdAt: '2024-08-19T10:00:00Z', page: 124 },
                        ]
                    },
                    {
                        id: 'eso_3_m_b5', name: '5. Estadística', videos: [
                            { id: 'eso_3_m_b5_v1', title: 'Tablas de Frecuencias y Gráficos', description: 'Construcción de tablas de frecuencias y diagramas de barras, histogramas, etc.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Tablas de frecuencias, diagramas de barras, histogramas', createdAt: '2024-08-20T10:00:00Z', page: 130 },
                            { id: 'eso_3_m_b5_v2', title: 'Medidas de Centralización', description: 'Cálculo de media, mediana y moda.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Medidas de centralización: media, mediana y moda', createdAt: '2024-08-21T10:00:00Z', page: 135 },
                            { id: 'eso_3_m_b5_v3', title: 'Medidas de Dispersión', description: 'Cálculo de rango, varianza y desviación típica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Medidas de dispersión: rango, varianza y desviación típica', createdAt: '2024-08-22T10:00:00Z', page: 140 },
                        ]
                    },
                    {
                        id: 'eso_3_m_b6', name: '6. Probabilidad', videos: [
                            { id: 'eso_3_m_b6_v1', title: 'Sucesos y Espacio Muestral', description: 'Experimentos aleatorios, sucesos y espacio muestral.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Experimentos aleatorios, espacio muestral y sucesos', createdAt: '2024-08-23T10:00:00Z', page: 148 },
                            { id: 'eso_3_m_b6_v2', title: 'Regla de Laplace', description: 'Cálculo de probabilidades simples usando la regla de Laplace.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Regla de Laplace', createdAt: '2024-08-24T10:00:00Z', page: 152 },
                            { id: 'eso_3_m_b6_v3', title: 'Probabilidad Compuesta', description: 'Introducción a la probabilidad compuesta simple.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Probabilidad compuesta simple', createdAt: '2024-08-25T10:00:00Z', page: 156 },
                        ]
                    },
                ]
            },
            {
                id: 'eso_3_fisica_quimica',
                name: 'Física y Química',
                icon: 'PhysicsIcon',
                createdAt: '2024-01-10T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'eso_3_fyq_b1', name: '1. La actividad científica', videos: [
                            { id: 'eso_3_fyq_b1_v1', title: 'Método Científico y Magnitudes', description: 'Etapas del método, unidades del SI y notación científica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Método científico, magnitudes y unidades', createdAt: '2024-09-01T10:00:00Z', page: 10 },
                            { id: 'eso_3_fyq_b1_v2', title: 'Trabajo en Laboratorio', description: 'Normas de seguridad, manejo de material y registro de datos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Normas de seguridad y material de laboratorio', createdAt: '2024-09-02T10:00:00Z', page: 14 },
                        ]
                    },
                    {
                        id: 'eso_3_fyq_b2', name: '2. La materia', videos: [
                            { id: 'eso_3_fyq_b2_v1', title: 'Propiedades y Estados de la Materia', description: 'Estudio de los estados de agregación y el modelo cinético-molecular.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Propiedades de la materia, estados y modelo cinético-molecular', createdAt: '2024-09-03T10:00:00Z', page: 20 },
                            { id: 'eso_3_fyq_b2_v2', title: 'Sustancias Puras y Mezclas', description: 'Diferenciación y métodos de separación de mezclas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Sustancias puras, mezclas y métodos de separación', createdAt: '2024-09-04T10:00:00Z', page: 26 },
                            { id: 'eso_3_fyq_b2_v3', title: 'Estructura Atómica y Enlaces', description: 'Partículas subatómicas, número atómico/másico y enlaces.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Estructura atómica y enlaces químicos', createdAt: '2024-09-05T10:00:00Z', page: 32 },
                        ]
                    },
                    {
                        id: 'eso_3_fyq_b3', name: '3. Los cambios', videos: [
                            { id: 'eso_3_fyq_b3_v1', title: 'Reacciones Químicas', description: 'Cambios físicos y químicos, y ajuste de ecuaciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Cambios físicos y químicos, reacciones químicas', createdAt: '2024-09-06T10:00:00Z', page: 40 },
                            { id: 'eso_3_fyq_b3_v2', title: 'Ley de Conservación de la Masa', description: 'Aplicación de la ley de Lavoisier a las reacciones químicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ley de conservación de la masa', createdAt: '2024-09-07T10:00:00Z', page: 45 },
                            { id: 'eso_3_fyq_b3_v3', title: 'Formulación y Nomenclatura Inorgánica', description: 'Formulación de óxidos, hidruros, sales y ácidos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Formulación y nomenclatura inorgánica', createdAt: '2024-09-08T10:00:00Z', page: 50 },
                        ]
                    },
                    {
                        id: 'eso_3_fyq_b4', name: '4. El movimiento y las fuerzas', videos: [
                            { id: 'eso_3_fyq_b4_v1', title: 'Cinemática: MRU y MRUA', description: 'Estudio de la posición, velocidad y aceleración.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Movimiento rectilíneo uniforme (MRU) y uniformemente acelerado (MRUA)', createdAt: '2024-09-09T10:00:00Z', page: 60 },
                            { id: 'eso_3_fyq_b4_v2', title: 'Leyes de Newton', description: 'Aplicación de las tres leyes de Newton a problemas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Leyes de Newton', createdAt: '2024-09-10T10:00:00Z', page: 66 },
                            { id: 'eso_3_fyq_b4_v3', title: 'Máquinas Simples', description: 'Entendiendo la ventaja mecánica de las máquinas simples.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Máquinas simples', createdAt: '2024-09-11T10:00:00Z', page: 72 },
                        ]
                    },
                    {
                        id: 'eso_3_fyq_b5', name: '5. Energía', videos: [
                            { id: 'eso_3_fyq_b5_v1', title: 'Tipos de Energía y Conservación', description: 'Transformaciones y principio de conservación de la energía.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Energía, tipos y conservación', createdAt: '2024-09-12T10:00:00Z', page: 80 },
                            { id: 'eso_3_fyq_b5_v2', title: 'Energía Térmica y Transferencia de Calor', description: 'Diferencia entre calor y temperatura y sus mecanismos de transferencia.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Energía térmica, calor, temperatura y transferencia', createdAt: '2024-09-13T10:00:00Z', page: 85 },
                        ]
                    },
                    {
                        id: 'eso_3_fyq_b6', name: '6. Electricidad y magnetismo', videos: [
                            { id: 'eso_3_fyq_b6_v1', title: 'Carga y Corriente Eléctrica', description: 'Fenómenos electrostáticos y conceptos de corriente eléctrica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Carga eléctrica y corriente eléctrica', createdAt: '2024-09-14T10:00:00Z', page: 92 },
                            { id: 'eso_3_fyq_b6_v2', title: 'Ley de Ohm y Circuitos', description: 'Resolución de circuitos sencillos en serie y paralelo.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ley de Ohm y circuitos eléctricos', createdAt: '2024-09-15T10:00:00Z', page: 98 },
                            { id: 'eso_3_fyq_b6_v3', title: 'Potencia Eléctrica y Magnetismo', description: 'Cálculo de potencia y energía, y relación entre electricidad y magnetismo.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Potencia eléctrica y magnetismo', createdAt: '2024-09-16T10:00:00Z', page: 104 },
                        ]
                    }
                ]
            }
        ]
    },
    // --- 4º E.S.O. ---
    {
        id: 'eso_4',
        name: '4º E.S.O.',
        createdAt: '2024-01-10T10:00:00Z',
        subjects: [
            {
                id: 'eso_4_matematicas_a',
                name: 'Matemáticas A (Ciencias)',
                icon: 'MathIcon',
                createdAt: '2024-01-10T10:00:00Z',
                videos: [],
                blocks: [
                    { 
                        id: 'eso_4_ma_b1', name: '1. Números y Álgebra', videos: [
                            { id: 'eso_4_ma_v1', title: 'Números Reales y Notación Científica', description: 'Propiedades, operaciones y jerarquía de los números reales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Números reales, propiedades, operaciones y notación científica', createdAt: '2024-10-01T10:00:00Z', page: 12 },
                            { id: 'eso_4_ma_v2', title: 'Potencias, Raíces y Radicales', description: 'Simplificación y operaciones con potencias y radicales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Potencias, raíces y radicales', createdAt: '2024-10-02T10:00:00Z', page: 19 },
                            { id: 'eso_4_ma_v3', title: 'Polinomios y Fracciones Algebraicas', description: 'Operaciones, factorización y simplificación de fracciones algebraicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Polinomios y fracciones algebraicas', createdAt: '2024-10-03T10:00:00Z', page: 27 },
                            { id: 'eso_4_ma_v4', title: 'Ecuaciones y Sistemas', description: 'Resolución de ecuaciones de primer y segundo grado, y sistemas lineales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ecuaciones de primer y segundo grado, y sistemas de ecuaciones lineales', createdAt: '2024-10-04T10:00:00Z', page: 35 },
                            { id: 'eso_4_ma_v5', title: 'Inecuaciones y Sistemas de Inecuaciones', description: 'Resolución de inecuaciones de primer grado y sistemas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Inecuaciones y sistemas de inecuaciones', createdAt: '2024-10-05T10:00:00Z', page: 41 },
                        ]
                    },
                    { 
                        id: 'eso_4_ma_b2', name: '2. Funciones', videos: [
                            { id: 'eso_4_ma_v6', title: 'Concepto de Función', description: 'Formas de representación: tablas, gráficas y expresiones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Concepto de función y formas de representación', createdAt: '2024-10-06T10:00:00Z', page: 50 },
                            { id: 'eso_4_ma_v7', title: 'Funciones Lineales, Afines y Cuadráticas', description: 'Estudio de la recta y la parábola y sus aplicaciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Funciones lineales, afines y cuadráticas', createdAt: '2024-10-07T10:00:00Z', page: 58 },
                            { id: 'eso_4_ma_v8', title: 'Funciones Exponenciales y Logarítmicas', description: 'Propiedades y representación gráfica de estas funciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Funciones exponenciales y logarítmicas', createdAt: '2024-10-08T10:00:00Z', page: 65 },
                            { id: 'eso_4_ma_v9', title: 'Composición y Función Inversa', description: 'Operaciones avanzadas con funciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Funciones inversas y composición de funciones', createdAt: '2024-10-09T10:00:00Z', page: 72 },
                        ]
                    },
                     { 
                        id: 'eso_4_ma_b3', name: '3. Geometría y Trigonometría', videos: [
                            { id: 'eso_4_ma_v10', title: 'Semejanza y Teorema de Pitágoras', description: 'Aplicaciones de la semejanza y el teorema de Pitágoras.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Semejanza de figuras y teorema de Pitágoras', createdAt: '2024-10-10T10:00:00Z', page: 80 },
                            { id: 'eso_4_ma_v11', title: 'Trigonometría en Triángulos Rectángulos', description: 'Definición y cálculo de razones trigonométricas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Trigonometría en triángulos rectángulos', createdAt: '2024-10-11T10:00:00Z', page: 88 },
                            { id: 'eso_4_ma_v12', title: 'Resolución de Triángulos', description: 'Resolución de triángulos rectángulos y oblicuángulos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Resolución de triángulos', createdAt: '2024-10-12T10:00:00Z', page: 95 },
                            { id: 'eso_4_ma_v13', title: 'Grados y Radianes', description: 'Conversión entre grados y radianes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ángulos en grados y radianes', createdAt: '2024-10-13T10:00:00Z', page: 101 },
                        ]
                    },
                    { 
                        id: 'eso_4_ma_b4', name: '4. Estadística y Probabilidad', videos: [
                            { id: 'eso_4_ma_v14', title: 'Estadística Unidimensional', description: 'Tablas, gráficos y medidas de centralización y dispersión.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Estadística unidimensional: tablas, gráficos, media, mediana, moda, varianza y desviación típica', createdAt: '2024-10-14T10:00:00Z', page: 110 },
                            { id: 'eso_4_ma_v15', title: 'Estadística Bidimensional', description: 'Correlación y regresión lineal simple.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Estadística bidimensional: correlación y regresión lineal', createdAt: '2024-10-15T10:00:00Z', page: 118 },
                            { id: 'eso_4_ma_v16', title: 'Combinatoria Básica', description: 'Permutaciones, variaciones y combinaciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Combinatoria: permutaciones, variaciones y combinaciones', createdAt: '2024-10-16T10:00:00Z', page: 125 },
                            { id: 'eso_4_ma_v17', title: 'Probabilidad Compuesta y Condicional', description: 'Regla de Laplace y probabilidad de sucesos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Probabilidad compuesta y condicional', createdAt: '2024-10-17T10:00:00Z', page: 132 },
                        ]
                    }
                ]
            },
            {
                id: 'eso_4_matematicas_b',
                name: 'Matemáticas B (Aplicadas)',
                icon: 'MathIcon',
                createdAt: '2024-01-10T10:00:00Z',
                videos: [],
                blocks: [
                    { 
                        id: 'eso_4_mb_b1', name: '1. Números y Proporcionalidad', videos: [
                            { id: 'eso_4_mb_v1', title: 'Números Reales y Notación Científica', description: 'Operaciones, jerarquía y uso de la notación científica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Números reales: operaciones, jerarquía y notación científica', createdAt: '2024-11-01T10:00:00Z', page: 14 },
                            { id: 'eso_4_mb_v2', title: 'Potencias y Raíces', description: 'Cálculo con potencias y raíces.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Potencias y raíces', createdAt: '2024-11-02T10:00:00Z', page: 20 },
                            { id: 'eso_4_mb_v3', title: 'Porcentajes e Interés', description: 'Cálculo de porcentajes, interés simple y compuesto.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Porcentajes, interés simple y compuesto', createdAt: '2024-11-03T10:00:00Z', page: 26 },
                            { id: 'eso_4_mb_v4', title: 'Proporcionalidad, Escalas y Razones', description: 'Aplicaciones de la proporcionalidad en problemas prácticos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Proporcionalidad directa e inversa, escalas y razones', createdAt: '2024-11-04T10:00:00Z', page: 32 },
                        ]
                    },
                    { 
                        id: 'eso_4_mb_b2', name: '2. Álgebra y Modelización', videos: [
                            { id: 'eso_4_mb_v5', title: 'Expresiones Algebraicas y Ecuaciones', description: 'Resolución de ecuaciones de primer y segundo grado.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Expresiones algebraicas, ecuaciones de primer y segundo grado', createdAt: '2024-11-05T10:00:00Z', page: 40 },
                            { id: 'eso_4_mb_v6', title: 'Sistemas de Ecuaciones Lineales', description: 'Resolución de sistemas con dos incógnitas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Sistemas de ecuaciones lineales con dos incógnitas', createdAt: '2024-11-06T10:00:00Z', page: 46 },
                            { id: 'eso_4_mb_v7', title: 'Resolución de Problemas Cotidianos', description: 'Planteamiento de problemas con ecuaciones y sistemas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Resolución de problemas de la vida cotidiana', createdAt: '2024-11-07T10:00:00Z', page: 52 },
                        ]
                    },
                    { 
                        id: 'eso_4_mb_b3', name: '3. Funciones y Gráficas', videos: [
                            { id: 'eso_4_mb_v8', title: 'Funciones Lineales y Afines', description: 'Estudio de la recta y sus aplicaciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Funciones lineales y afines', createdAt: '2024-11-08T10:00:00Z', page: 60 },
                            { id: 'eso_4_mb_v9', title: 'Funciones Cuadráticas', description: 'Estudio de la parábola y sus propiedades.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Funciones cuadráticas, parábola', createdAt: '2024-11-09T10:00:00Z', page: 66 },
                            { id: 'eso_4_mb_v10', title: 'Interpretación de Gráficas Reales', description: 'Análisis de gráficas en contextos económicos y sociales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Interpretación de gráficas en contextos reales', createdAt: '2024-11-10T10:00:00Z', page: 72 },
                        ]
                    },
                    { 
                        id: 'eso_4_mb_b4', name: '4. Geometría y Medida', videos: [
                            { id: 'eso_4_mb_v11', title: 'Figuras Planas y Cuerpos Geométricos', description: 'Cálculo de perímetros, áreas y volúmenes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Figuras planas y cuerpos geométricos', createdAt: '2024-11-11T10:00:00Z', page: 80 },
                            { id: 'eso_4_mb_v12', title: 'Teorema de Pitágoras y Semejanza', description: 'Aplicaciones prácticas del teorema y la semejanza.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Teorema de Pitágoras y semejanza', createdAt: '2024-11-12T10:00:00Z', page: 86 },
                            { id: 'eso_4_mb_v13', title: 'Trigonometría Básica', description: 'Seno, coseno y tangente en triángulos rectángulos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Trigonometría básica en triángulos rectángulos', createdAt: '2024-11-13T10:00:00Z', page: 92 },
                        ]
                    },
                    { 
                        id: 'eso_4_mb_b5', name: '5. Estadística y Probabilidad', videos: [
                            { id: 'eso_4_mb_v14', title: 'Tablas, Gráficos y Medidas', description: 'Medidas de centralización y dispersión.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Tablas, gráficos, media, mediana, moda, rango y desviación típica', createdAt: '2024-11-14T10:00:00Z', page: 100 },
                            { id: 'eso_4_mb_v15', title: 'Probabilidad Simple y Compuesta', description: 'Regla de Laplace y sucesos independentes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Probabilidad simple y compuesta, regla de Laplace', createdAt: '2024-11-15T10:00:00Z', page: 106 },
                        ]
                    }
                ]
            },
            {
                id: 'eso_4_fisica_quimica',
                name: 'Física y Química',
                icon: 'PhysicsIcon',
                createdAt: '2024-01-10T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'eso_4_fyq_b1', name: '1. El Movimiento y las Fuerzas', videos: [
                            { id: 'eso_4_fyq_2', title: 'Cinemática: MRU y MRUA', description: 'Estudio del movimiento rectilíneo uniforme y acelerado.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '1ZEP-8H3G0k' }], topic: 'Movimiento rectilíneo uniforme y acelerado (MRU y MRUA)', createdAt: '2024-03-17T10:00:00Z', page: 158 },
                            { id: 'eso_fyq_1', title: 'Leyes de Newton', description: 'Explicación de las tres leyes del movimiento de Newton.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'p-s92O8v2kI' }], topic: 'Leyes de Newton', createdAt: '2024-03-16T10:00:00Z', page: 150 },
                            { id: 'eso_4_fyq_v3', title: 'Fuerzas y Presión en Fluidos', description: 'Estudio de la presión hidrostática y el principio de Arquímedes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Fuerzas y presión en fluidos, principio de Arquímedes', createdAt: '2024-12-01T10:00:00Z', page: 165 },
                        ]
                    },
                    {
                        id: 'eso_4_fyq_b2', name: '2. Energía', videos: [
                            { id: 'eso_4_fyq_v4', title: 'Trabajo, Potencia y Energía', description: 'Definiciones y cálculo de trabajo, potencia y energía mecánica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Trabajo, potencia y energía mecánica', createdAt: '2024-12-02T10:00:00Z', page: 172 },
                            { id: 'eso_4_fyq_v5', title: 'Conservación de la Energía', description: 'Aplicación del principio de conservación de la energía mecánica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Conservación de la energía mecánica', createdAt: '2024-12-03T10:00:00Z', page: 178 },
                        ]
                    },
                    {
                        id: 'eso_4_fyq_b3', name: '3. Estructura de la Materia', videos: [
                            { id: 'eso_4_fyq_v6', title: 'Modelos Atómicos y Tabla Periódica', description: 'Evolución de los modelos atómicos y propiedades periódicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Modelos atómicos, tabla periódica y propiedades', createdAt: '2024-12-04T10:00:00Z', page: 185 },
                            { id: 'eso_4_fyq_v7', title: 'Enlaces Químicos', description: 'Tipos de enlaces: iónico, covalente y metálico.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Enlaces químicos: iónico, covalente y metálico', createdAt: '2024-12-05T10:00:00Z', page: 192 },
                        ]
                    },
                    {
                        id: 'eso_4_fyq_b4', name: '4. Reacciones Químicas', videos: [
                            { id: 'eso_4_fyq_v8', title: 'El Mol y Cálculos Estequiométricos', description: 'Cálculos con moles, masas y volúmenes en reacciones químicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Cálculos estequiométricos y mol', createdAt: '2024-12-06T10:00:00Z', page: 200 },
                            { id: 'eso_4_fyq_v9', title: 'Tipos de Reacciones Químicas', description: 'Reacciones de síntesis, descomposición, desplazamiento y doble desplazamiento.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Tipos de reacciones químicas', createdAt: '2024-12-07T10:00:00Z', page: 208 },
                            { id: 'eso_4_fyq_v10', title: 'Formulación y Nomenclatura Orgánica', description: 'Introducción a la química del carbono: alcanos, alquenos y alquinos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Química orgánica: alcanos, alquenos y alquinos', createdAt: '2024-12-08T10:00:00Z', page: 215 },
                        ]
                    }
                ]
            }
        ]
    },
     // --- 1º Bachillerato ---
    {
        id: 'bach_1_ciencias',
        name: '1º Bachillerato de Ciencias',
        createdAt: '2024-01-20T10:00:00Z',
        subjects: [
            {
                id: 'bach_c1_matematicas',
                name: 'Matemáticas I',
                icon: 'MathIcon',
                createdAt: '2024-01-20T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'bach_c1_m_b1', name: '1. Números y Álgebra', videos: [
                            { id: 'bach_c1_m_v1', title: 'Operaciones con números reales', description: 'Operaciones avanzadas con números reales, intervalos y valor absoluto.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Operaciones con números reales', createdAt: '2024-04-01T10:00:00Z', page: 12 },
                            { id: 'bach_c1_m_v2', title: 'Potencias, radicales y logaritmos', description: 'Propiedades y operaciones con potencias, radicales y logaritmos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Potencias, radicales y logaritmos', createdAt: '2024-04-02T10:00:00Z', page: 18 },
                            { id: 'bach_c1_m_v3', title: 'Polinomios: suma, producto, división y factorización', description: 'División de polinomios, regla de Ruffini y factorización.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Polinomios: división y factorización', createdAt: '2024-04-03T10:00:00Z', page: 25 },
                            { id: 'bach_c1_m_v4', title: 'Fracciones algebraicas', description: 'Simplificación y operaciones con fracciones algebraicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Fracciones algebraicas', createdAt: '2024-04-04T10:00:00Z', page: 32 },
                            { id: 'bach_c1_m_v5', title: 'Ecuaciones: de segundo grado, bicuadradas, exponenciales y logarítmicas', description: 'Resolución de ecuaciones bicuadradas, con radicales, exponenciales y logarítmicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ecuaciones bicuadradas, exponenciales y logarítmicas', createdAt: '2024-04-05T10:00:00Z', page: 40 },
                            { id: 'bach_c1_m_v6', title: 'Sistemas de ecuaciones lineales (métodos de sustitución, igualación, Gauss)', description: 'Resolución de sistemas de ecuaciones lineales con tres incógnitas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Sistemas de ecuaciones: método de Gauss', createdAt: '2024-04-06T10:00:00Z', page: 48 },
                            { id: 'bach_c1_m_v7', title: 'Inecuaciones y resolución gráfica', description: 'Resolución de inecuaciones y representación de las soluciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Inecuaciones y resolución gráfica', createdAt: '2024-04-07T10:00:00Z', page: 55 },
                        ]
                    },
                    {
                        id: 'bach_c1_m_b2', name: '2. Funciones', videos: [
                            { id: 'bach_c1_m_v8', title: 'Concepto de función: dominio, recorrido, tipos', description: 'Análisis completo de las propiedades de las funciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Funciones: dominio, recorrido, tipos', createdAt: '2024-04-08T10:00:00Z', page: 65 },
                            { id: 'bach_c1_m_v9', title: 'Composición e inversa de funciones', description: 'Cálculo de la composición de funciones y la función inversa.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Composición e inversa de funciones', createdAt: '2024-04-09T10:00:00Z', page: 72 },
                            { id: 'bach_c1_m_v10', title: 'Representación gráfica de funciones elementales', description: 'Representación de funciones lineales, cuadráticas, de proporcionalidad inversa, etc.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Representación gráfica de funciones elementales', createdAt: '2024-04-10T10:00:00Z', page: 78 },
                            { id: 'bach_c1_m_v11', title: 'Transformaciones: traslaciones, simetrías, escalados', description: 'Traslaciones, simetrías y escalados de funciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Transformaciones de funciones', createdAt: '2024-04-11T10:00:00Z', page: 85 },
                            { id: 'bach_c1_m_v12', title: 'Límites y continuidad', description: 'Cálculo de límites, indeterminaciones y estudio de la continuidad.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Límites y continuidad de funciones', createdAt: '2024-04-12T10:00:00Z', page: 92 },
                            { id: 'bach_c1_m_v13', title: 'Asíntotas: verticales, horizontales y oblicuas', description: 'Cálculo de asíntotas verticales, horizontales y oblicuas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Asíntotas: verticales, horizontales y oblicuas', createdAt: '2024-04-13T10:00:00Z', page: 100 },
                        ]
                    },
                    {
                        id: 'bach_c1_m_b3', name: '3. Cálculo Diferencial', videos: [
                            { id: 'bach_c1_m_v14', title: 'Derivada: definición y reglas de derivación', description: 'Definición de derivada en un punto y reglas básicas de derivación.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Derivada: definición y reglas de derivación', createdAt: '2024-04-14T10:00:00Z', page: 110 },
                            { id: 'bach_c1_m_v15', title: 'Derivadas de funciones polinómicas, racionales, exponenciales, logarítmicas y trigonométricas', description: 'Derivadas de funciones polinómicas, racionales, exponenciales, etc.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Derivadas de funciones comunes', createdAt: '2024-04-15T10:00:00Z', page: 118 },
                            { id: 'bach_c1_m_v16', title: 'Aplicaciones de la derivada: Recta tangente y normal', description: 'Cálculo de la ecuación de la recta tangente y normal a una curva.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Recta tangente y normal', createdAt: '2024-04-16T10:00:00Z', page: 125 },
                            { id: 'bach_c1_m_v17', title: 'Aplicaciones de la derivada: Crecimiento y decrecimiento', description: 'Estudio del crecimiento y decrecimiento de una función.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Crecimiento y decrecimiento de funciones', createdAt: '2024-04-17T10:00:00Z', page: 132 },
                            { id: 'bach_c1_m_v18', title: 'Aplicaciones de la derivada: Máximos, mínimos y puntos de inflexión', description: 'Cálculo de extremos relativos y puntos de inflexión.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Máximos, mínimos y puntos de inflexión', createdAt: '2024-04-18T10:00:00Z', page: 140 },
                        ]
                    },
                    {
                        id: 'bach_c1_m_b4', name: '4. Trigonometría', videos: [
                            { id: 'bach_c1_m_v19', title: 'Razones trigonométricas', description: 'Estudio de las razones trigonométricas en la circunferencia goniométrica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Razones trigonométricas', createdAt: '2024-04-19T10:00:00Z', page: 150 },
                            { id: 'bach_c1_m_v20', title: 'Identidades fundamentales', description: 'Uso de las identidades fundamentales y fórmulas de suma y resta.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Identidades trigonométricas fundamentales', createdAt: '2024-04-20T10:00:00Z', page: 158 },
                            { id: 'bach_c1_m_1', title: 'Resolución de triángulos (teoremas del seno y del coseno)', description: 'Resolución de triángulos y ecuaciones trigonométricas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'FomGCLA1p3A' }], topic: 'Trigonometría avanzada, Teorema del seno y coseno', createdAt: '2024-04-21T10:00:00Z', page: 165 },
                            { id: 'bach_c1_m_v21', title: 'Ecuaciones trigonométricas', description: 'Resolución de ecuaciones trigonométricas sencillas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ecuaciones trigonométricas', createdAt: '2024-04-22T10:00:00Z', page: 172 },
                        ]
                    },
                    {
                        id: 'bach_c1_m_b5', name: '5. Números Complejos', videos: [
                            { id: 'bach_c1_m_v22', title: 'Forma binómica', description: 'Introducción a los números complejos y operaciones básicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Números complejos: forma binómica y operaciones', createdAt: '2024-04-23T10:00:00Z', page: 180 },
                            { id: 'bach_c1_m_v23', title: 'Operaciones: suma, resta, producto, cociente', description: 'Representación de números complejos en el plano.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Módulo, conjugado y representación gráfica de números complejos', createdAt: '2024-04-24T10:00:00Z', page: 188 },
                        ]
                    },
                    {
                        id: 'bach_c1_m_b6', name: '6. Geometría Analítica', videos: [
                            { id: 'bach_c1_m_2', title: 'Rectas en el plano: ecuaciones, pendientes, distancias', description: 'Operaciones con vectores, producto escalar y ecuaciones de la recta.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '6ACz322vW2c' }], topic: 'Vectores en 2D y rectas en el plano', createdAt: '2024-04-25T10:00:00Z', page: 195 },
                            { id: 'bach_c1_m_v24', title: 'Cónicas: circunferencia, parábola, elipse e hipérbola', description: 'Identificación y representación de circunferencias, parábolas, elipses e hipérbolas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Cónicas: circunferencia, parábola, elipse, hipérbola', createdAt: '2024-04-26T10:00:00Z', page: 205 },
                        ]
                    },
                    {
                        id: 'bach_c1_m_b7', name: '7. Estadística y Probabilidad', videos: [
                            { id: 'bach_c1_m_v25', title: 'Estadística descriptiva: media, mediana, moda, desviación típica', description: 'Cálculo de media, mediana, moda y desviación típica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Estadística descriptiva', createdAt: '2024-04-27T10:00:00Z', page: 215 },
                            { id: 'bach_c1_m_v26', title: 'Representación de datos: tablas, diagramas', description: 'Representación e interpretación de datos estadísticos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Representación de datos estadísticos', createdAt: '2024-04-28T10:00:00Z', page: 222 },
                            { id: 'bach_c1_m_v27', title: 'Probabilidad: conceptos básicos, regla de Laplace', description: 'Conceptos básicos de probabilidad y aplicaciones de la regla de Laplace.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Probabilidad y regla de Laplace', createdAt: '2024-04-29T10:00:00Z', page: 230 },
                            { id: 'bach_c1_m_v28', title: 'Probabilidad compuesta: sucesos dependientes e independientes', description: 'Estudio de sucesos dependientes e independientes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Probabilidad compuesta: sucesos dependientes e independientes', createdAt: '2024-04-30T10:00:00Z', page: 238 },
                        ]
                    }
                ]
            },
             {
                id: 'bach_c1_fisica_quimica',
                name: 'Física y Química',
                icon: 'PhysicsIcon',
                createdAt: '2024-01-20T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'bach_c1_fyq_b1', name: '1. Magnitudes y unidades', videos: [
                            { id: 'bach_c1_fyq_v1', title: 'Sistema Internacional y Notación Científica', description: 'Unidades del SI, análisis dimensional y notación científica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Sistema Internacional de Unidades y notación científica', createdAt: '2024-05-01T10:00:00Z', page: 12 },
                            { id: 'bach_c1_fyq_v2', title: 'Cifras Significativas y Errores', description: 'Tratamiento de errores en la medida y cifras significativas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Cifras significativas y errores', createdAt: '2024-05-02T10:00:00Z', page: 16 },
                        ]
                    },
                    {
                        id: 'bach_c1_fyq_b2', name: '2. Leyes y conceptos básicos en Química', videos: [
                            { id: 'bach_c1_fyq_v3', title: 'Leyes Ponderales (Lavoisier, Proust)', description: 'Leyes clásicas de las reacciones químicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Leyes Ponderales', createdAt: '2024-05-03T10:00:00Z', page: 22 },
                            { id: 'bach_c1_fyq_v4', title: 'El Mol y Cálculos de Masas', description: 'Concepto de mol, masa molar y composición centesimal.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'El mol y cálculos de masas', createdAt: '2024-05-04T10:00:00Z', page: 28 },
                            { id: 'bach_c1_fyq_v5', title: 'Gases Ideales y Disoluciones', description: 'Ley de los gases ideales y cálculo de concentraciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Gases ideales y disoluciones', createdAt: '2024-05-05T10:00:00Z', page: 35 },
                        ]
                    },
                    {
                        id: 'bach_c1_fyq_b3', name: '3. Estructura de la materia', videos: [
                            { id: 'bach_c1_fyq_v6', title: 'Evolución de los Modelos Atómicos', description: 'De Dalton a Bohr, entendiendo la estructura del átomo.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Modelos atómicos', createdAt: '2024-05-06T10:00:00Z', page: 42 },
                            { id: 'bach_c1_fyq_v7', title: 'Configuración Electrónica y Tabla Periódica', description: 'Distribución de electrones y propiedades periódicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Configuración electrónica y tabla periódica', createdAt: '2024-05-07T10:00:00Z', page: 48 },
                        ]
                    },
                    {
                        id: 'bach_c1_fyq_b4', name: '4. Enlace químico y formulación inorgánica', videos: [
                            { id: 'bach_c1_fyq_v8', title: 'Tipos de Enlace Químico', description: 'Enlace iónico, covalente y metálico y sus propiedades.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Enlace iónico, covalente y metálico', createdAt: '2024-05-08T10:00:00Z', page: 55 },
                            { id: 'bach_c1_fyq_1', title: 'Formulación Inorgánica', description: 'Nomenclatura de óxidos, hidruros, sales, etc.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '7DBhBDr022Q' }], topic: 'Formulación y nomenclatura inorgánica', createdAt: '2024-04-05T10:00:00Z', page: 60 },
                        ]
                    },
                    {
                        id: 'bach_c1_fyq_b5', name: '5. Reacciones químicas', videos: [
                            { id: 'bach_c1_fyq_v9', title: 'Ajuste de Ecuaciones Químicas', description: 'Métodos de tanteo y algebraico para ajustar reacciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ajuste de ecuaciones químicas', createdAt: '2024-05-09T10:00:00Z', page: 70 },
                            { id: 'bach_c1_fyq_v10', title: 'Cálculos Estequiométricos', description: 'Cálculos mol-mol, masa-masa y con reactivo limitante.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Cálculos estequiométricos', createdAt: '2024-05-10T10:00:00Z', page: 76 },
                        ]
                    },
                    {
                        id: 'bach_c1_fyq_b6', name: '6. Química del carbono', videos: [
                            { id: 'bach_c1_fyq_v11', title: 'Nomenclatura Orgánica: Alcanos, Alquenos, Alquinos', description: 'Formulación y nomenclatura de hidrocarburos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Nomenclatura orgánica básica', createdAt: '2024-05-11T10:00:00Z', page: 85 },
                            { id: 'bach_c1_fyq_v12', title: 'Grupos Funcionales Principales', description: 'Identificación y nomenclatura de alcoholes, aldehídos, cetonas, etc.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Grupos funcionales', createdAt: '2024-05-12T10:00:00Z', page: 92 },
                        ]
                    },
                    {
                        id: 'bach_c1_fyq_b7', name: '7. Cinemática', videos: [
                            { id: 'bach_c1_fyq_v13', title: 'Movimiento Rectilíneo (MRU y MRUA)', description: 'Estudio de ecuaciones y gráficas del movimiento.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Movimiento rectilíneo uniforme y acelerado', createdAt: '2024-05-13T10:00:00Z', page: 100 },
                            { id: 'bach_c1_fyq_v14', title: 'Caída Libre y Tiro Vertical', description: 'Aplicación del MRUA al movimiento vertical.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Caída libre y tiro vertical', createdAt: '2024-05-14T10:00:00Z', page: 106 },
                        ]
                    },
                    {
                        id: 'bach_c1_fyq_b8', name: '8. Dinámica', videos: [
                            { id: 'bach_c1_fyq_v15', title: 'Aplicación de las Leyes de Newton', description: 'Resolución de problemas con las leyes de Newton.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Leyes de Newton', createdAt: '2024-05-15T10:00:00Z', page: 115 },
                            { id: 'bach_c1_fyq_v16', title: 'Fuerzas de Fricción', description: 'Estudio y cálculo de la fuerza de rozamiento.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Fuerza de fricción', createdAt: '2024-05-16T10:00:00Z', page: 122 },
                            { id: 'bach_c1_fyq_v17', title: 'Movimiento Circular Uniforme (MCU)', description: 'Estudio de la aceleración centrípeta y la fuerza centrípeta.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Movimiento circular', createdAt: '2024-05-17T10:00:00Z', page: 128 },
                        ]
                    },
                    {
                        id: 'bach_c1_fyq_b9', name: '9. Trabajo y energía', videos: [
                            { id: 'bach_c1_fyq_v18', title: 'Trabajo, Energía Cinética y Potencial', description: 'Definiciones y cálculo de las diferentes formas de energía.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Trabajo y energía', createdAt: '2024-05-18T10:00:00Z', page: 135 },
                            { id: 'bach_c1_fyq_v19', title: 'Principio de Conservación de la Energía Mecánica', description: 'Aplicación del principio a la resolución de problemas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Conservación de la energía', createdAt: '2024-05-19T10:00:00Z', page: 142 },
                        ]
                    },
                    {
                        id: 'bach_c1_fyq_b10', name: '10. Calor y termodinámica', videos: [
                            { id: 'bach_c1_fyq_v20', title: 'Calor, Temperatura y Cambios de Estado', description: 'Diferencias entre calor y temperatura, y calor latente.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Calor y temperatura', createdAt: '2024-05-20T10:00:00Z', page: 150 },
                            { id: 'bach_c1_fyq_v21', title: 'Primer Principio de la Termodinámica', description: 'Relación entre calor, trabajo y energía interna.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Leyes de la termodinámica', createdAt: '2024-05-21T10:00:00Z', page: 158 },
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'bach_1_sociales',
        name: '1º Bachillerato de Sociales',
        createdAt: '2024-01-20T10:00:00Z',
        subjects: [
            {
                id: 'bach_s1_matematicas_ccss',
                name: 'Matemáticas CCSS I',
                icon: 'MathIcon',
                createdAt: '2024-01-20T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'bach_s1_m_ccss_b1',
                        name: '1. Análisis de datos y estadística',
                        videos: [
                            { id: 'bach_s1_m_ccss_v1', title: 'Tipos de variables y gráficos estadísticos', description: 'Aprende a diferenciar variables cualitativas y cuantitativas y a representarlas gráficamente.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Tipos de variables y gráficos estadísticos', createdAt: '2024-06-01T10:00:00Z', page: 10 },
                            { id: 'bach_s1_m_ccss_v2', title: 'Medidas de centralización: media, mediana, moda', description: 'Calcula e interpreta las principales medidas de centralización de un conjunto de datos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Medidas de centralización', createdAt: '2024-06-02T10:00:00Z', page: 15 },
                            { id: 'bach_s1_m_ccss_v3', title: 'Medidas de dispersión: rango, desviación típica, varianza', description: 'Analiza la dispersión de los datos con el rango, la varianza y la desviación típica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Medidas de dispersión', createdAt: '2024-06-03T10:00:00Z', page: 20 },
                            { id: 'bach_s1_m_ccss_v4', title: 'Distribuciones estadísticas y su interpretación', description: 'Interpreta la forma de las distribuciones estadísticas y sus características.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Distribuciones estadísticas', createdAt: '2024-06-04T10:00:00Z', page: 25 },
                        ]
                    },
                    {
                        id: 'bach_s1_m_ccss_b2',
                        name: '2. Álgebra y funciones',
                        videos: [
                            { id: 'bach_s1_m_ccss_v5', title: 'Expresiones algebraicas y operaciones', description: 'Repasa las operaciones con polinomios y fracciones algebraicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Expresiones algebraicas y operaciones', createdAt: '2024-06-05T10:00:00Z', page: 32 },
                            { id: 'bach_s1_m_ccss_v6', title: 'Ecuaciones de primer y segundo grado', description: 'Resolución de ecuaciones lineales y cuadráticas y su aplicación a problemas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ecuaciones de primer y segundo grado', createdAt: '2024-06-06T10:00:00Z', page: 38 },
                            { id: 'bach_s1_m_ccss_v7', title: 'Sistemas de ecuaciones lineales', description: 'Resuelve sistemas de ecuaciones con dos y tres incógnitas por diferentes métodos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Sistemas de ecuaciones lineales', createdAt: '2024-06-07T10:00:00Z', page: 45 },
                            { id: 'bach_s1_m_ccss_v8', title: 'Funciones: concepto, dominio, recorrido', description: 'Entiende el concepto de función y aprende a calcular su dominio y recorrido.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Concepto de función, dominio y recorrido', createdAt: '2024-06-08T10:00:00Z', page: 52 },
                            { id: 'bach_s1_m_ccss_v9', title: 'Tipos de funciones: lineales, cuadráticas, exponenciales, logarítmicas', description: 'Estudio de las propiedades y características de las funciones elementales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Tipos de funciones elementales', createdAt: '2024-06-09T10:00:00Z', page: 58 },
                            { id: 'bach_s1_m_ccss_v10', title: 'Representación gráfica y análisis de funciones', description: 'Aprende a representar y analizar gráficas de funciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Representación gráfica y análisis de funciones', createdAt: '2024-06-10T10:00:00Z', page: 65 },
                        ]
                    },
                    {
                        id: 'bach_s1_m_ccss_b3',
                        name: '3. Matemática financiera',
                        videos: [
                            { id: 'bach_s1_m_ccss_v11', title: 'Interés simple y compuesto', description: 'Diferencia y calcula el interés simple y el compuesto en operaciones financieras.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Interés simple y compuesto', createdAt: '2024-06-11T10:00:00Z', page: 75 },
                            { id: 'bach_s1_m_ccss_v12', title: 'Rentas y préstamos', description: 'Conceptos básicos sobre rentas y sistemas de amortización de préstamos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Rentas y préstamos', createdAt: '2024-06-12T10:00:00Z', page: 82 },
                            { id: 'bach_s1_m_ccss_v13', title: 'Valor actual y valor futuro', description: 'Calcula el valor del dinero en diferentes momentos del tiempo.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Valor actual y valor futuro', createdAt: '2024-06-13T10:00:00Z', page: 88 },
                            { id: 'bach_s1_m_ccss_v14', title: 'Aplicaciones en economía y empresa', description: 'Resuelve problemas prácticos de matemática financiera.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Aplicaciones de matemática financiera', createdAt: '2024-06-14T10:00:00Z', page: 94 },
                        ]
                    },
                    {
                        id: 'bach_s1_m_ccss_b4',
                        name: '4. Probabilidad',
                        videos: [
                            { id: 'bach_s1_m_ccss_v15', title: 'Experimentos aleatorios y espacio muestral', description: 'Diferencia entre experimentos aleatorios y deterministas y define el espacio muestral.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Experimentos aleatorios y espacio muestral', createdAt: '2024-06-15T10:00:00Z', page: 102 },
                            { id: 'bach_s1_m_ccss_v16', title: 'Probabilidad simple y compuesta', description: 'Cálculo de probabilidades de sucesos simples y compuestos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Probabilidad simple y compuesta', createdAt: '2024-06-16T10:00:00Z', page: 108 },
                            { id: 'bach_s1_m_ccss_v17', title: 'Regla de Laplace', description: 'Aplica la Regla de Laplace en experimentos equiprobables.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Regla de Laplace', createdAt: '2024-06-17T10:00:00Z', page: 113 },
                            { id: 'bach_s1_m_ccss_v18', title: 'Sucesos independientes y dependientes', description: 'Entiende la diferencia entre sucesos dependientes e independientes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Sucesos independientes y dependientes', createdAt: '2024-06-18T10:00:00Z', page: 118 },
                            { id: 'bach_s1_m_ccss_v19', title: 'Diagramas de árbol y tablas de contingencia', description: 'Utiliza diagramas de árbol y tablas para resolver problemas de probabilidad.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Diagramas de árbol y tablas de contingencia', createdAt: '2024-06-19T10:00:00Z', page: 124 },
                        ]
                    },
                    {
                        id: 'bach_s1_m_ccss_b5',
                        name: '5. Programación lineal y optimización',
                        videos: [
                            { id: 'bach_s1_m_ccss_v20', title: 'Planteamiento de problemas reales', description: 'Traduce problemas de la vida real a un sistema de inecuaciones lineales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Planteamiento de problemas de programación lineal', createdAt: '2024-06-20T10:00:00Z', page: 135 },
                            { id: 'bach_s1_m_ccss_v21', title: 'Restricciones y función objetivo', description: 'Define la región factible a partir de las restricciones y la función a optimizar.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Restricciones y función objetivo', createdAt: '2024-06-21T10:00:00Z', page: 140 },
                            { id: 'bach_s1_m_ccss_v22', title: 'Resolución gráfica de problemas de optimización', description: 'Encuentra la solución óptima (máximo o mínimo) de forma gráfica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Resolución gráfica de problemas de optimización', createdAt: '2024-06-22T10:00:00Z', page: 145 },
                        ]
                    }
                ]
            },
             {
                id: 'bach_s1_economia',
                name: 'Economía',
                icon: 'ChartBarIcon',
                createdAt: '2024-01-20T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'bach_s1_e_b1', name: '1. Principios básicos de la economía', videos: [
                            { id: 'bach_s1_e_b1_v1', title: 'Qué es la economía y por qué es necesaria', description: 'Introducción a los conceptos fundamentales de la ciencia económica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Concepto de economía', createdAt: '2024-07-01T10:00:00Z', page: 10 },
                            { id: 'bach_s1_e_b1_v2', title: 'Escasez, coste de oportunidad y elección', description: 'Comprende las decisiones económicas básicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Escasez y coste de oportunidad', createdAt: '2024-07-02T10:00:00Z', page: 15 },
                            { id: 'bach_s1_e_b1_v3', title: 'Necesidades, bienes y servicios', description: 'Clasificación de los bienes y servicios que satisfacen necesidades.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Necesidades, bienes y servicios', createdAt: '2024-07-03T10:00:00Z', page: 20 },
                            { id: 'bach_s1_e_b1_v4', title: 'Factores de producción', description: 'Tierra, trabajo, capital y tecnología como pilares de la producción.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Factores de producción', createdAt: '2024-07-04T10:00:00Z', page: 25 },
                        ]
                    },
                    {
                        id: 'bach_s1_e_b2', name: '2. Producción y crecimiento económico', videos: [
                            { id: 'bach_s1_e_b2_v1', title: 'Proceso productivo y eficiencia', description: 'Análisis del proceso de producción y la Frontera de Posibilidades de Producción.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Proceso productivo y FPP', createdAt: '2024-07-05T10:00:00Z', page: 32 },
                            { id: 'bach_s1_e_b2_v2', title: 'Productividad y tecnología', description: 'La importancia de la tecnología en el aumento de la productividad.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Productividad y tecnología', createdAt: '2024-07-06T10:00:00Z', page: 38 },
                            { id: 'bach_s1_e_b2_v3', title: 'Crecimiento económico y desarrollo sostenible', description: 'Diferencias y relación entre crecimiento y desarrollo.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Crecimiento y desarrollo sostenible', createdAt: '2024-07-07T10:00:00Z', page: 44 },
                            { id: 'bach_s1_e_b2_v4', title: 'Indicadores económicos: PIB, renta per cápita, IDH', description: 'Cómo se mide la riqueza y el bienestar de un país.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Indicadores económicos', createdAt: '2024-07-08T10:00:00Z', page: 50 },
                        ]
                    },
                    {
                        id: 'bach_s1_e_b3', name: '3. Agentes y sistemas económicos', videos: [
                            { id: 'bach_s1_e_b3_v1', title: 'Familias, empresas y sector público', description: 'Los protagonistas del flujo circular de la renta.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Agentes económicos', createdAt: '2024-07-09T10:00:00Z', page: 58 },
                            { id: 'bach_s1_e_b3_v2', title: 'Sistemas económicos: capitalismo, socialismo, economía mixta', description: 'Comparativa de los principales sistemas económicos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Sistemas económicos', createdAt: '2024-07-10T10:00:00Z', page: 64 },
                            { id: 'bach_s1_e_b3_v3', title: 'Economía de mercado y planificación', description: 'Ventajas y desventajas de cada sistema de asignación de recursos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Economía de mercado y planificación', createdAt: '2024-07-11T10:00:00Z', page: 70 },
                        ]
                    },
                    {
                        id: 'bach_s1_e_b4', name: '4. La empresa', videos: [
                            { id: 'bach_s1_e_b4_v1', title: 'Tipos de empresa y su función económica', description: 'Clasificación de las empresas según su forma jurídica, tamaño y sector.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Tipos de empresa', createdAt: '2024-07-12T10:00:00Z', page: 78 },
                            { id: 'bach_s1_e_b4_v2', title: 'Organización interna y departamentos', description: 'Estructura funcional de una empresa típica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Organización de la empresa', createdAt: '2024-07-13T10:00:00Z', page: 85 },
                            { id: 'bach_s1_e_b4_v3', title: 'Ciclo de explotación y rentabilidad', description: 'Análisis de costes, ingresos y beneficios.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Costes, ingresos y beneficios', createdAt: '2024-07-14T10:00:00Z', page: 92 },
                            { id: 'bach_s1_e_b4_v4', title: 'Responsabilidad social corporativa (RSC)', description: 'El papel de la empresa en la sociedad y el medio ambiente.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Responsabilidad Social Corporativa (RSC)', createdAt: '2024-07-15T10:00:00Z', page: 98 },
                        ]
                    },
                    {
                        id: 'bach_s1_e_b5', name: '5. El mercado', videos: [
                            { id: 'bach_s1_e_b5_v1', title: 'Ley de la oferta y la demanda', description: 'Cómo interactúan compradores y vendedores para determinar el precio.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Oferta y demanda', createdAt: '2024-07-16T10:00:00Z', page: 106 },
                            { id: 'bach_s1_e_b5_v2', title: 'Formación de precios', description: 'El equilibrio de mercado y sus desplazamientos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Equilibrio de mercado', createdAt: '2024-07-17T10:00:00Z', page: 112 },
                            { id: 'bach_s1_e_b5_v3', title: 'Competencia perfecta e imperfecta', description: 'Características de los diferentes tipos de mercado.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Competencia perfecta e imperfecta', createdAt: '2024-07-18T10:00:00Z', page: 118 },
                            { id: 'bach_s1_e_b5_v4', title: 'Fallos del mercado y regulación', description: 'Externalidades, bienes públicos y el papel del Estado.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Fallos del mercado', createdAt: '2024-07-19T10:00:00Z', page: 124 },
                        ]
                    },
                    {
                        id: 'bach_s1_e_b6', name: '6. Tipos de mercado', videos: [
                            { id: 'bach_s1_e_b6_v1', title: 'Monopolio, oligopolio y competencia monopolística', description: 'Análisis detallado de los mercados de competencia imperfecta.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Monopolio, oligopolio, competencia monopolística', createdAt: '2024-07-20T10:00:00Z', page: 132 },
                            { id: 'bach_s1_e_b6_v2', title: 'Estrategias de marketing', description: 'Las 4P del Marketing Mix: Producto, Precio, Plaza y Promoción.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Estrategias de marketing', createdAt: '2024-07-21T10:00:00Z', page: 138 },
                            { id: 'bach_s1_e_b6_v3', title: 'Publicidad y comportamiento del consumidor', description: 'Cómo influye la publicidad en las decisiones de compra.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Publicidad y consumidor', createdAt: '2024-07-22T10:00:00Z', page: 144 },
                        ]
                    },
                    {
                        id: 'bach_s1_e_b7', name: '7. El dinero y el sistema financiero', videos: [
                            { id: 'bach_s1_e_b7_v1', title: 'Funciones del dinero', description: 'Medio de cambio, depósito de valor y unidad de cuenta.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Funciones del dinero', createdAt: '2024-07-23T10:00:00Z', page: 152 },
                            { id: 'bach_s1_e_b7_v2', title: 'Bancos y entidades financieras', description: 'El papel de los intermediarios financieros en la economía.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Sistema financiero', createdAt: '2024-07-24T10:00:00Z', page: 158 },
                            { id: 'bach_s1_e_b7_v3', title: 'Banco Central y política monetaria', description: 'Cómo el BCE controla la oferta monetaria.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Política monetaria', createdAt: '2024-07-25T10:00:00Z', page: 165 },
                            { id: 'bach_s1_e_b7_v4', title: 'Inflación y tipos de interés', description: 'Causas y consecuencias de la subida de precios.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Inflación y tipos de interés', createdAt: '2024-07-26T10:00:00Z', page: 172 },
                        ]
                    },
                    {
                        id: 'bach_s1_e_b8', name: '8. Sector público y política fiscal', videos: [
                            { id: 'bach_s1_e_b8_v1', title: 'Ingresos y gastos públicos', description: 'De dónde obtiene el dinero el Estado y en qué lo gasta.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ingresos y gastos públicos', createdAt: '2024-07-27T10:00:00Z', page: 180 },
                            { id: 'bach_s1_e_b8_v2', title: 'Impuestos: directos e indirectos', description: 'Clasificación de los impuestos: IRPF, IVA, etc.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Impuestos directos e indirectos', createdAt: '2024-07-28T10:00:00Z', page: 186 },
                            { id: 'bach_s1_e_b8_v3', title: 'Déficit público y deuda', description: 'Diferencia entre déficit y deuda y sus implicaciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Déficit y deuda pública', createdAt: '2024-07-29T10:00:00Z', page: 192 },
                            { id: 'bach_s1_e_b8_v4', title: 'Redistribución de la renta', description: 'El papel del Estado en la corrección de desigualdades.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Redistribución de la renta', createdAt: '2024-07-30T10:00:00Z', page: 198 },
                        ]
                    }
                ]
            }
        ]
    },
    // --- 2º Bachillerato ---
    {
        id: 'bach_2_ciencias',
        name: '2º Bachillerato de Ciencias',
        createdAt: '2024-01-20T10:00:00Z',
        subjects: [
            {
                id: 'bach_c2_matematicas',
                name: 'Matemáticas II',
                icon: 'MathIcon',
                createdAt: '2024-01-20T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'bach_c2_m_b1',
                        name: '1. Álgebra lineal',
                        videos: [
                            { id: 'bach_c_m_4', title: 'Matrices y Determinantes', description: 'Operaciones con matrices, cálculo de determinantes y matriz inversa.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'h-T6lYs6i4g' }], topic: 'Matrices y determinantes', createdAt: '2024-05-10T10:00:00Z', page: 35 },
                            { id: 'bach_c_m_5', title: 'Sistemas de Ecuaciones (Gauss y Cramer)', description: 'Resolución de sistemas de ecuaciones lineales por diferentes métodos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '2-LEB3I5WqE' }], topic: 'Sistemas de ecuaciones lineales', createdAt: '2024-05-11T10:00:00Z', page: 42 },
                            { id: 'bach_c2_m_v3', title: 'Discusión de sistemas: Rouché-Frobenius', description: 'Aplica el teorema de Rouché-Frobenius para discutir la compatibilidad de sistemas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Discusión de sistemas com Rouché-Frobenius', createdAt: '2024-09-01T10:00:00Z', page: 48 },
                        ]
                    },
                     {
                        id: 'bach_c2_m_b2',
                        name: '2. Geometría en el espacio',
                        videos: [
                            { id: 'bach_c2_m_v4', title: 'Vectores: Producto escalar, vectorial y mixto', description: 'Operaciones con vectores en 3D y sus aplicaciones geométricas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Vectores en el espacio y productos', createdAt: '2024-09-05T10:00:00Z', page: 55 },
                            { id: 'bach_c2_m_v5', title: 'Rectas y Planos: Ecuaciones y Posiciones Relativas', description: 'Estudio de las ecuaciones de rectas y planos y su posición en el espacio.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ecuaciones de rectas y planos en el espacio', createdAt: '2024-09-06T10:00:00Z', page: 62 },
                            { id: 'bach_c2_m_v6', title: 'Distancias, Ángulos, Áreas y Volúmenes', description: 'Cálculo de métricas en el espacio utilizando herramientas vectoriales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Métrica en el espacio: distancias, ángulos, áreas, volúmenes', createdAt: '2024-09-07T10:00:00Z', page: 70 },
                        ]
                    },
                    {
                        id: 'bach_c2_m_b3',
                        name: '3. Análisis de funciones',
                        videos: [
                            { id: 'bach_c_m_1', title: 'Límites, Indeterminaciones y Continuidad', description: 'Cálculo de límites e indeterminaciones. Estudio de la continuidad.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'GG_40LrtjDE' }], topic: 'Límites y continuidad de funciones', createdAt: '2024-05-01T10:00:00Z', page: 10 },
                            { id: 'bach_c2_m_v7', title: 'Asíntotas: Verticales, Horizontales y Oblicuas', description: 'Cálculo y representación de las asíntotas de una función.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Cálculo de Asíntotas', createdAt: '2024-09-10T10:00:00Z', page: 14 },
                            { id: 'bach_c_m_2', title: 'Derivadas: Reglas y Aplicaciones', description: 'Cálculo de derivadas y su uso para optimización y estudio de funciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'AunqG6pS5Vo' }], topic: 'Derivadas y sus aplicaciones', createdAt: '2024-05-02T10:00:00Z', page: 18 },
                            { id: 'bach_c2_m_v8', title: 'Estudio de Funciones: Monotonía y Curvatura', description: 'Análisis de crecimiento, extremos, concavidad y puntos de inflexión.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Estudio de funciones con derivadas', createdAt: '2024-09-12T10:00:00Z', page: 22 },
                        ]
                    },
                    {
                        id: 'bach_c2_m_b4',
                        name: '4. Integración',
                        videos: [
                            { id: 'bach_c_m_3', title: 'Integrales Indefinidas', description: 'Métodos de integración: por partes, cambio de variable, etc.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'n_i3hMIbA4Y' }], topic: 'Integración indefinida', createdAt: '2024-05-03T10:00:00Z', page: 25 },
                            { id: 'bach_c2_m_v9', title: 'Integrales Definidas: Regla de Barrow', description: 'Cálculo de integrales definidas y su interpretación geométrica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Integrales definidas y Regla de Barrow', createdAt: '2024-09-15T10:00:00Z', page: 29 },
                            { id: 'bach_c2_m_v10', title: 'Aplicaciones de la Integral: Cálculo de Áreas', description: 'Uso de la integral definida para calcular el área bajo una curva o entre curvas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Cálculo de áreas com integrales', createdAt: '2024-09-16T10:00:00Z', page: 32 },
                        ]
                    },
                    {
                        id: 'bach_c2_m_b5',
                        name: '5. Probabilidad y estadística',
                        videos: [
                            { id: 'bach_c2_m_v11', title: 'Probabilidad Compuesta y Condicionada', description: 'Sucesos dependientes, independientes y Teorema de Bayes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Probabilidad compuesta, condicionada y Teorema de Bayes', createdAt: '2024-09-20T10:00:00Z', page: 80 },
                            { id: 'bach_c2_m_v12', title: 'Distribuciones de Probabilidad: Binomial y Normal', description: 'Estudio de las distribuciones de probabilidad discreta y continua más importantes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Distribuciones Binomial y Normal', createdAt: '2024-09-21T10:00:00Z', page: 88 },
                            { id: 'bach_c2_m_v13', title: 'Estadística Inferencial: Muestreo', description: 'Introducción al muestreo y a la estimación de parámetros poblacionales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Estadística inferencial y muestreo', createdAt: '2024-09-22T10:00:00Z', page: 95 },
                        ]
                    }
                ]
            },
            {
                id: 'bach_c2_quimica',
                name: 'Química',
                icon: 'ChemistryIcon',
                createdAt: '2024-01-20T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'bach_c2_q_b1',
                        name: 'Bloque 1: La materia y su estructura',
                        videos: [
                            { id: 'bach_c2_q_v1', title: 'Estructura atómica', description: 'Modelos atómicos, número cuántico, configuración electrónica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Estructura atómica y modelos atómicos', createdAt: '2024-11-10T10:00:00Z', page: 10 },
                            { id: 'bach_c2_q_v2', title: 'Sistema periódico', description: 'Propiedades periódicas como radio atómico, energía de ionización y afinidad electrónica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Sistema periódico y propiedades periódicas', createdAt: '2024-11-11T10:00:00Z', page: 15 },
                            { id: 'bach_c2_q_v3', title: 'Enlace químico', description: 'Enlace iónico, covalente, metálico; geometría molecular y fuerzas intermoleculares.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Enlace químico, geometría molecular y fuerzas intermoleculares', createdAt: '2024-11-12T10:00:00Z', page: 20 },
                        ]
                    },
                    {
                        id: 'bach_c2_q_b2',
                        name: 'Bloque 2: Energía y reacciones químicas',
                        videos: [
                            { id: 'bach_c2_q_v4', title: 'Termoquímica', description: 'Entalpía, entropía, energía libre y leyes de la termodinámica.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Termoquímica: entalpía, entropía, energía libre', createdAt: '2024-11-13T10:00:00Z', page: 28 },
                            { id: 'bach_c2_q_v5', title: 'Cinética química', description: 'Velocidad de reacción, factores que la afectan y teoría de colisiones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Cinética química y velocidad de reacción', createdAt: '2024-11-14T10:00:00Z', page: 34 },
                            { id: 'bach_c_m_6', title: 'Equilibrio Químico', description: 'Constante de equilibrio, principio de Le Châtelier y aplicaciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '5eOB2aL_3cE' }], topic: 'Equilibrio químico', createdAt: '2024-05-20T10:00:00Z', page: 40 },
                        ]
                    },
                    {
                        id: 'bach_c2_q_b3',
                        name: 'Bloque 3: Reacciones químicas específicas',
                        videos: [
                            { id: 'bach_c_m_7', title: 'Reacciones Ácido-Base', description: 'Teorías, pH, pOH, disoluciones tampón y titulaciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'tSEaGWSGjP8' }], topic: 'Reacciones ácido-base y pH', createdAt: '2024-05-21T10:00:00Z', page: 48 },
                            { id: 'bach_c2_q_v6', title: 'Reacciones Redox', description: 'Oxidación, reducción, ajuste de reacciones, pilas y electrólisis.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Reacciones redox, pilas y electrólisis', createdAt: '2024-11-15T10:00:00Z', page: 55 },
                        ]
                    },
                    {
                        id: 'bach_c2_q_b4',
                        name: 'Bloque 4: Química del carbono',
                        videos: [
                            { id: 'bach_c2_q_v7', title: 'Química Orgánica', description: 'Nomenclatura, isomería y grupos funcionales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Química orgánica: nomenclatura, isomería, grupos funcionales', createdAt: '2024-11-16T10:00:00Z', page: 62 },
                            { id: 'bach_c2_q_v8', title: 'Reacciones Orgánicas', description: 'Reacciones de adición, sustitución, eliminación y polimerización.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Reacciones orgánicas: adición, sustitución, eliminación', createdAt: '2024-11-17T10:00:00Z', page: 68 },
                            { id: 'bach_c2_q_v9', title: 'Aplicaciones de la Química Orgánica', description: 'Química de polímeros, química farmacéutica y química de alimentos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Aplicaciones de la química orgánica', createdAt: '2024-11-18T10:00:00Z', page: 74 },
                        ]
                    },
                    {
                        id: 'bach_c2_q_b5',
                        name: 'Bloque 5: Química descriptiva y aplicaciones',
                        videos: [
                            { id: 'bach_c2_q_v10', title: 'Química Descriptiva', description: 'Propiedades y obtención de elementos representativos y de transición.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Química descriptiva de elementos', createdAt: '2024-11-19T10:00:00Z', page: 80 },
                            { id: 'bach_c2_q_v11', title: 'Impacto Medioambiental', description: 'Estudio del impacto medioambiental de diversos procesos químicos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Impacto medioambiental de la química', createdAt: '2024-11-20T10:00:00Z', page: 85 },
                            { id: 'bach_c2_q_v12', title: 'Prácticas de Laboratorio', description: 'Tratamiento de datos experimentales y prácticas de laboratorio comunes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Prácticas de laboratorio de química', createdAt: '2024-11-21T10:00:00Z', page: 90 },
                        ]
                    }
                ]
            },
            {
                id: 'bach_c2_fisica',
                name: 'Física',
                icon: 'PhysicsIcon',
                createdAt: '2024-01-20T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'bach_c2_f_b1',
                        name: '⚙️ Bloque 1 – Mecánica y campos',
                        videos: [
                            { id: 'bach_c2_f_v1', title: 'Leyes de Newton', description: 'Dinámica, trabajo y energía. Fuerzas conservativas y no conservativas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Leyes de Newton, dinámica, trabajo y energía', createdAt: '2024-10-01T10:00:00Z', page: 50 },
                            { id: 'bach_c2_f_v3', title: 'Gravitación Universal', description: 'Ley de Newton de la gravitación, campo gravitatorio y potencial.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Campo gravitatorio y Ley de Gravitación Universal', createdAt: '2024-10-03T10:00:00Z', page: 60 },
                            { id: 'bach_c2_f_v4', title: 'Movimiento de Satélites y Órbitas', description: 'Órbitas, velocidad orbital y energía en satélites.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Movimiento de satélites y órbitas', createdAt: '2024-10-04T10:00:00Z', page: 65 },
                            { id: 'bach_c2_f_v5', title: 'Campo Eléctrico', description: 'Carga eléctrica, Ley de Coulomb, campo y potencial eléctrico, y Ley de Gauss.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Campo eléctrico, Ley de Coulomb y Ley de Gauss', createdAt: '2024-10-05T10:00:00Z', page: 70 },
                            { id: 'bach_c2_f_v6', title: 'Campo Magnético', description: 'Fuerza de Lorentz, Leyes de Biot–Savart y Ampère.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Campo magnético, fuerza de Lorentz, Biot-Savart y Ampère', createdAt: '2024-10-06T10:00:00Z', page: 75 },
                            { id: 'bach_c2_f_v7', title: 'Inducción Electromagnética', description: 'Ley de Faraday–Lenz, corrientes inducidas y aplicaciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Inducción electromagnética y Ley de Faraday-Lenz', createdAt: '2024-10-07T10:00:00Z', page: 80 },
                        ]
                    },
                    {
                        id: 'bach_c2_f_b2',
                        name: '🌊 Bloque 2 – Ondas y vibraciones',
                        videos: [
                            { id: 'bach_c2_f_v8', title: 'Movimiento Armónico Simple', description: 'Estudio del oscilador armónico y su energía.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Movimiento armónico simple (MAS) y osciladores', createdAt: '2024-10-08T10:00:00Z', page: 88 },
                            { id: 'bach_c2_f_v9', title: 'Movimiento Ondulatorio', description: 'Ondas mecánicas y electromagnéticas y sus propiedades.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Movimiento ondulatorio, ondas mecánicas y electromagnéticas', createdAt: '2024-10-09T10:00:00Z', page: 94 },
                            { id: 'bach_c2_f_v10', title: 'Propiedades de las Ondas', description: 'Reflexión, refracción, difracción e interferencia.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Reflexión, refracción, difracción e interferencia de ondas', createdAt: '2024-10-10T10:00:00Z', page: 100 },
                            { id: 'bach_c2_f_v11', title: 'Sonido y Luz', description: 'Naturaleza y propiedades del sonido y la luz como ondas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Ondas sonoras y luminosas', createdAt: '2024-10-11T10:00:00Z', page: 106 },
                        ]
                    },
                    {
                        id: 'bach_c2_f_b3',
                        name: '🔬 Bloque 3 – Física moderna',
                        videos: [
                            { id: 'bach_c2_f_v12', title: 'Dualidad Onda-Partícula', description: 'Experimento de la doble rendija y efecto fotoeléctrico.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Dualidad onda-partícula y efecto fotoeléctrico', createdAt: '2024-10-12T10:00:00Z', page: 115 },
                            { id: 'bach_c2_f_v13', title: 'Física Nuclear', description: 'Radiactividad, leyes de desintegración, reacciones nucleares y energía nuclear.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Física nuclear, radiactividad y reacciones nucleares', createdAt: '2024-10-13T10:00:00Z', page: 122 },
                            { id: 'bach_c2_f_v14', title: 'Relatividad Especial', description: 'Postulados de Einstein, dilatación temporal y contracción de longitudes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Relatividad especial de Einstein', createdAt: '2024-10-14T10:00:00Z', page: 128 },
                        ]
                    },
                    {
                        id: 'bach_c2_f_b4',
                        name: '🔍 Bloque 4 – Óptica',
                        videos: [
                            { id: 'bach_c2_f_v15', title: 'Óptica Geométrica: Lentes y Espejos', description: 'Estudio de la formación de imágenes en lentes y espejos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Óptica geométrica, lentes y espejos', createdAt: '2024-10-15T10:00:00Z', page: 135 },
                            { id: 'bach_c2_f_v17', title: 'Defectos de la Visión y Corrección', description: 'Miopía, hipermetropía, astigmatismo y su corrección con lentes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Defectos de la visión y su corrección', createdAt: '2024-10-17T10:00:00Z', page: 145 },
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'bach_2_sociales',
        name: '2º Bachillerato de Sociales',
        createdAt: '2024-01-20T10:00:00Z',
        subjects: [
            {
                id: 'bach_s2_matematicas_ccss',
                name: 'Matemáticas CCSS II',
                icon: 'MathIcon',
                createdAt: '2024-01-20T10:00:00Z',
                videos: [],
                blocks: [
                    {
                        id: 'bach_s2_m_b0',
                        name: '🧠 Bloque 1 – Procesos, métodos y actitudes en matemáticas',
                        videos: [
                            { id: 'bach_s2_m_v10', title: 'Resolución de Problemas en Contexto Real', description: 'Estrategias para plantear y resolver problemas matemáticos aplicados a situaciones reales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Resolución de problemas en contexto real', createdAt: '2024-11-01T10:00:00Z', page: 5 },
                            { id: 'bach_s2_m_v11', title: 'Lenguaje y Notación Matemática', description: 'Uso correcto de la terminología y símbolos matemáticos para una comunicación precisa.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Lenguaje y notación matemática', createdAt: '2024-11-02T10:00:00Z', page: 6 },
                            { id: 'bach_s2_m_v12', title: 'Estrategias de Modelización', description: 'Cómo traducir problemas del mundo real a modelos matemáticos funcionales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Estrategias de razonamiento y modelización', createdAt: '2024-11-03T10:00:00Z', page: 7 },
                            { id: 'bach_s2_m_v13', title: 'Interpretación de Resultados y Toma de Decisiones', description: 'Análisis crítico de los resultados obtenidos y cómo usarlos para tomar decisiones informadas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Interpretación de resultados y toma de decisiones', createdAt: '2024-11-04T10:00:00Z', page: 8 },
                            { id: 'bach_s2_m_v14', title: 'Uso de Herramientas Tecnológicas', description: 'Aplicación de calculadoras, software y otras herramientas para resolver y representar problemas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Uso de herramientas tecnológicas', createdAt: '2024-11-05T10:00:00Z', page: 9 },
                        ]
                    },
                    {
                        id: 'bach_s2_m_b1', name: '🔢 Bloque 2 – Números y álgebra', videos: [
                            { id: 'bach_s2_m_v1', title: 'Matrices y Determinantes', description: 'Representación de datos, operaciones con matrices y cálculo de determinantes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Matrices y determinantes aplicados a CCSS', createdAt: '2024-05-15T10:00:00Z', page: 12 },
                            { id: 'bach_s2_m_v6', title: 'Sistemas de Ecuaciones (Gauss y Cramer)', description: 'Resolución de sistemas de ecuaciones lineales aplicados a problemas de ciencias sociales.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Sistemas de ecuaciones lineales CCSS', createdAt: '2024-10-20T10:00:00Z', page: 16 },
                            { id: 'bach_s2_m_v2', title: 'Programación Lineal', description: 'Planteamiento de problemas, resolución gráfica y análisis de soluciones óptimas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Programación lineal', createdAt: '2024-05-16T10:00:00Z', page: 20 },
                        ]
                    },
                    {
                        id: 'bach_s2_m_b2', name: '📈 Bloque 3 – Análisis matemático', videos: [
                            { id: 'bach_s2_m_v3', title: 'Funciones: Dominio, Continuidad y Límites', description: 'Estudio de funciones polinómicas, racionales, exponenciales y logarítmicas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Límites y continuidad de funciones aplicadas', createdAt: '2024-05-17T10:00:00Z', page: 30 },
                            { id: 'bach_s2_m_v4', title: 'Derivadas y Aplicaciones (Optimización)', description: 'Interpretación geométrica, crecimiento, decrecimiento, máximos y mínimos.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Derivadas y sus aplicaciones en economía', createdAt: '2024-05-18T10:00:00Z', page: 38 },
                            { id: 'bach_s2_m_v7', title: 'Integrales y Cálculo de Áreas', description: 'Cálculo de áreas bajo una curva y entre dos funciones, con aplicaciones sencillas.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Cálculo de áreas com integrales aplicadas', createdAt: '2024-10-21T10:00:00Z', page: 45 },
                        ]
                    },
                    {
                        id: 'bach_s2_m_b3', name: '🎲 Bloque 4 – Probabilidad y estadística', videos: [
                            { id: 'bach_s2_m_v8', title: 'Probabilidad Condicionada y Teorema de Bayes', description: 'Regla de Laplace, probabilidad condicionada, sucesos independientes y Teorema de Bayes.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Probabilidad condicionada y Teorema de Bayes', createdAt: '2024-10-22T10:00:00Z', page: 55 },
                            { id: 'bach_s2_m_v9', title: 'Distribuciones de Probabilidad (Binomial y Normal)', description: 'Estudio de variables aleatorias discretas y continuas y sus distribuciones.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Distribuciones Binomial y Normal', createdAt: '2024-10-23T10:00:00Z', page: 62 },
                            { id: 'bach_s2_m_v5', title: 'Inferencia Estadística: Intervalos y Contrastes', description: 'Estimación de parámetros, intervalos de confianza y contrastes de hipótesis.', youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }], topic: 'Inferencia estadística, intervalos de confianza y contrastes', createdAt: '2024-05-19T10:00:00Z', page: 70 },
                        ]
                    },
                ]
            }
        ]
    },
    // --- Selectividad (EBAU) ---
    {
        id: 'ebau',
        name: 'Selectividad (EBAU)',
        createdAt: '2024-06-10T10:00:00Z',
        subjects: [
            {
                id: 'ebau_matematicas_2',
                name: 'Matemáticas II (EBAU)',
                icon: 'MathIcon',
                createdAt: '2024-06-01T10:00:00Z',
                videos: [],
                blocks: [
                    ...[
                        { name: 'Madrid', short: 'mad' }, { name: 'Andalucía', short: 'and' }, { name: 'Cataluña', short: 'cat' },
                        { name: 'Comunidad Valenciana', short: 'val' }, { name: 'Galicia', short: 'gal' }, { name: 'País Vasco', short: 'pv' },
                        { name: 'Castilla y León', short: 'cyl' }, { name: 'Castilla-La Mancha', short: 'clm' }, { name: 'Canarias', short: 'can' },
                        { name: 'Aragón', short: 'ara' }, { name: 'Extremadura', short: 'ext' }, { name: 'Asturias', short: 'ast' },
                        { name: 'Murcia', short: 'mur' }, { name: 'Baleares', short: 'bal' }, { name: 'Cantabria', short: 'cnt' },
                        { name: 'Navarra', short: 'nav' }, { name: 'La Rioja', short: 'rio' }
                    ].map((community, c_idx) => ({
                        id: `ebau_m2_${community.short}`,
                        name: community.name,
                        videos: Array.from({ length: 11 }, (_, y_idx) => 2015 + y_idx).map(year => ({
                            id: `ebau_m_${community.short}_${year}`,
                            title: `Examen ${year} (Ordinaria)`,
                            description: `Resolución completa del examen de la convocatoria ordinaria de ${year} de ${community.name}.`,
                            youtubeLinks: [{ title: `Playlist Examen ${year}`, youtubeId: 'videoseries?list=PLQ-9a-b2Iun-c5QLb-0j3K5W4y_YV6wYd' }],
                            topic: `Resolución examen EBAU Matemáticas II ${community.name} ${year}`,
                            createdAt: `2024-06-02T10:00:00Z`,
                            page: 2000 + (c_idx * 11) + (year - 2015)
                        }))
                    }))
                ]
            },
            {
                id: 'ebau_quimica',
                name: 'Química (EBAU)',
                icon: 'ChemistryIcon',
                createdAt: '2024-06-11T10:00:00Z',
                videos: [],
                blocks: [
                    ...[
                        { name: 'Madrid', short: 'mad' }, { name: 'Andalucía', short: 'and' }, { name: 'Cataluña', short: 'cat' },
                        { name: 'Comunidad Valenciana', short: 'val' }, { name: 'Galicia', short: 'gal' }, { name: 'País Vasco', short: 'pv' },
                        { name: 'Castilla y León', short: 'cyl' }, { name: 'Castilla-La Mancha', short: 'clm' }, { name: 'Canarias', short: 'can' },
                        { name: 'Aragón', short: 'ara' }, { name: 'Extremadura', short: 'ext' }, { name: 'Asturias', short: 'ast' },
                        { name: 'Murcia', short: 'mur' }, { name: 'Baleares', short: 'bal' }, { name: 'Cantabria', short: 'cnt' },
                        { name: 'Navarra', short: 'nav' }, { name: 'La Rioja', short: 'rio' }
                    ].map((community, c_idx) => ({
                        id: `ebau_q_${community.short}`,
                        name: community.name,
                        videos: Array.from({ length: 11 }, (_, y_idx) => 2015 + y_idx).map(year => ({
                            id: `ebau_q_${community.short}_${year}`,
                            title: `Examen ${year} (Ordinaria)`,
                            description: `Resolución del examen de Química de ${community.name} ${year}.`,
                            youtubeLinks: [{ title: 'Explicación Principal', youtubeId: '5eOB2aL_3cE' }],
                            topic: `Resolución examen EBAU Química ${community.name} ${year}`,
                            createdAt: `2024-06-12T10:00:00Z`,
                            page: 3000 + (c_idx * 11) + (year - 2015)
                        }))
                    }))
                ]
            },
            {
                id: 'ebau_fisica',
                name: 'Física (EBAU)',
                icon: 'PhysicsIcon',
                createdAt: '2024-06-11T10:00:00Z',
                videos: [],
                blocks: [
                    ...[
                        { name: 'Madrid', short: 'mad' }, { name: 'Andalucía', short: 'and' }, { name: 'Cataluña', short: 'cat' },
                        { name: 'Comunidad Valenciana', short: 'val' }, { name: 'Galicia', short: 'gal' }, { name: 'País Vasco', short: 'pv' },
                        { name: 'Castilla y León', short: 'cyl' }, { name: 'Castilla-La Mancha', short: 'clm' }, { name: 'Canarias', short: 'can' },
                        { name: 'Aragón', short: 'ara' }, { name: 'Extremadura', short: 'ext' }, { name: 'Asturias', short: 'ast' },
                        { name: 'Murcia', short: 'mur' }, { name: 'Baleares', short: 'bal' }, { name: 'Cantabria', short: 'cnt' },
                        { name: 'Navarra', short: 'nav' }, { name: 'La Rioja', short: 'rio' }
                    ].map((community, c_idx) => ({
                        id: `ebau_f_${community.short}`,
                        name: community.name,
                        videos: Array.from({ length: 11 }, (_, y_idx) => 2015 + y_idx).map(year => ({
                            id: `ebau_f_${community.short}_${year}`,
                            title: `Examen ${year} (Ordinaria)`,
                            description: `Resolución del examen de Física de ${community.name} ${year}.`,
                            youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'p-s92O8v2kI' }],
                            topic: `Resolución examen EBAU Física ${community.name} ${year}`,
                            createdAt: `2024-06-13T10:00:00Z`,
                            page: 4000 + (c_idx * 11) + (year - 2015)
                        }))
                    }))
                ]
            },
            {
                id: 'ebau_matematicas_ccss_2',
                name: 'Matemáticas CCSS II (EBAU)',
                icon: 'MathIcon',
                createdAt: '2024-06-11T10:00:00Z',
                videos: [],
                blocks: [
                     ...[
                        { name: 'Madrid', short: 'mad' }, { name: 'Andalucía', short: 'and' }, { name: 'Cataluña', short: 'cat' },
                        { name: 'Comunidad Valenciana', short: 'val' }, { name: 'Galicia', short: 'gal' }, { name: 'País Vasco', short: 'pv' },
                        { name: 'Castilla y León', short: 'cyl' }, { name: 'Castilla-La Mancha', short: 'clm' }, { name: 'Canarias', short: 'can' },
                        { name: 'Aragón', short: 'ara' }, { name: 'Extremadura', short: 'ext' }, { name: 'Asturias', short: 'ast' },
                        { name: 'Murcia', short: 'mur' }, { name: 'Baleares', short: 'bal' }, { name: 'Cantabria', short: 'cnt' },
                        { name: 'Navarra', short: 'nav' }, { name: 'La Rioja', short: 'rio' }
                    ].map((community, c_idx) => ({
                        id: `ebau_mcss_${community.short}`,
                        name: community.name,
                        videos: Array.from({ length: 11 }, (_, y_idx) => 2015 + y_idx).map(year => ({
                            id: `ebau_mcss_${community.short}_${year}`,
                            title: `Examen ${year} (Ordinaria)`,
                            description: `Resolución del examen de Matemáticas CCSS II de ${community.name} ${year}.`,
                            youtubeLinks: [{ title: 'Explicación Principal', youtubeId: 'dQw4w9WgXcQ' }],
                            topic: `Resolución examen EBAU Matemáticas CCSS II ${community.name} ${year}`,
                            createdAt: `2024-06-14T10:00:00Z`,
                            page: 5000 + (c_idx * 11) + (year - 2015)
                        }))
                    }))
                ]
            }
        ]
    }
];