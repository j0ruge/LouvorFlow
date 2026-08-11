/**
 * Testes unitários dos schemas de body e params dos endpoints de músicas.
 *
 * Cobre em especial a proteção contra XSS via URL (`safeUrlSchema`, usado por
 * `link_versao` e `cifraclub_url`), o pré-processamento que converte `""`/`null`
 * em `undefined` nos campos opcionais, e a obrigatoriedade dos campos required.
 */

import {
    createMusicaBodySchema,
    createMusicaCompleteBodySchema,
    updateMusicaCompleteBodySchema,
    addVersaoBodySchema,
    updateVersaoBodySchema,
    addCategoriaBodySchema,
    addFuncaoBodySchema,
    musicaIdParamsSchema,
    musicaVersaoParamsSchema,
    musicaCategoriaParamsSchema,
    musicaFuncaoParamsSchema,
} from '../../src/validators/musicas.validators.js';

/** UUID válido reutilizado nos casos de teste. */
const UUID = '11111111-1111-4111-8111-111111111111';
/** Segundo UUID válido, para params com dois identificadores. */
const UUID_2 = '22222222-2222-4222-8222-222222222222';

/**
 * Schemas que expõem `link_versao` e `cifraclub_url` através de `safeUrlSchema`.
 * Todos precisam recusar protocolos perigosos — a proteção não pode valer só
 * em um dos caminhos de escrita.
 */
const SCHEMAS_COM_URL = [
    { nome: 'createMusicaCompleteBodySchema', schema: createMusicaCompleteBodySchema, base: { nome: 'Oceans' } },
    { nome: 'updateMusicaCompleteBodySchema', schema: updateMusicaCompleteBodySchema, base: { nome: 'Oceans' } },
    { nome: 'addVersaoBodySchema', schema: addVersaoBodySchema, base: {} },
    { nome: 'updateVersaoBodySchema', schema: updateVersaoBodySchema, base: {} },
] as const;

/**
 * Valida a guarda de protocolo das URLs aceitas pela API de músicas.
 * `javascript:`/`data:`/`vbscript:` em `href` viram Stored XSS no frontend.
 */
describe('safeUrlSchema (link_versao e cifraclub_url)', () => {
    describe.each(SCHEMAS_COM_URL)('$nome', ({ schema, base }) => {
        /** Protocolos de execução de script precisam ser recusados. */
        it.each([
            'javascript:alert(1)',
            'JavaScript:alert(1)',
            'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
            'vbscript:msgbox(1)',
        ])('recusa link_versao com protocolo perigoso: %s', (url) => {
            const result = schema.safeParse({ ...base, link_versao: url });
            expect(result.success).toBe(false);
        });

        /** A mesma guarda vale para o campo do CifraClub. */
        it('recusa cifraclub_url com protocolo javascript:', () => {
            const result = schema.safeParse({ ...base, cifraclub_url: 'javascript:alert(1)' });
            expect(result.success).toBe(false);
        });

        /** URL sem protocolo (relativa a esquema) não passa pelo `.url()` do Zod. */
        it('recusa URL relativa a protocolo (//evil.com)', () => {
            const result = schema.safeParse({ ...base, link_versao: '//evil.com/x' });
            expect(result.success).toBe(false);
        });

        /** Texto que não é URL alguma também é recusado. */
        it('recusa string que não é URL', () => {
            const result = schema.safeParse({ ...base, link_versao: 'não é uma url' });
            expect(result.success).toBe(false);
        });

        /** http e https são os únicos protocolos aceitos. */
        it.each(['http://cifraclub.com.br/a', 'https://cifraclub.com.br/a'])(
            'aceita URL http(s): %s',
            (url) => {
                const result = schema.safeParse({ ...base, link_versao: url });
                expect(result.success).toBe(true);
            },
        );
    });
});

/**
 * Verifica o `preprocess` que normaliza campos opcionais: o frontend envia `""`
 * para campo vazio, e sem essa conversão o `.url()`/`.uuid()` rejeitaria o
 * formulário em vez de tratar o campo como ausente.
 */
describe('preprocessamento de campos opcionais vazios', () => {
    /** String vazia e null viram `undefined` em vez de erro de validação. */
    it.each(['', null])('converte %p em undefined nos campos opcionais', (vazio) => {
        const result = createMusicaCompleteBodySchema.safeParse({
            nome: 'Oceans',
            artista_id: vazio,
            bpm: vazio,
            link_versao: vazio,
            cifraclub_url: vazio,
            intensidade: vazio,
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.artista_id).toBeUndefined();
            expect(result.data.bpm).toBeUndefined();
            expect(result.data.link_versao).toBeUndefined();
            expect(result.data.cifraclub_url).toBeUndefined();
            expect(result.data.intensidade).toBeUndefined();
        }
    });

    /** Intensidade fora do enum é recusada. */
    it('recusa intensidade fora do enum', () => {
        const result = addVersaoBodySchema.safeParse({ intensidade: 'lentíssima' });
        expect(result.success).toBe(false);
    });

    /** Os três valores de intensidade previstos são aceitos. */
    it.each(['calma', 'media', 'agitada'])('aceita intensidade %s', (intensidade) => {
        const result = addVersaoBodySchema.safeParse({ intensidade });
        expect(result.success).toBe(true);
    });

    /** bpm precisa ser inteiro positivo. */
    it.each([0, -5, 1.5])('recusa bpm inválido: %p', (bpm) => {
        const result = addVersaoBodySchema.safeParse({ bpm });
        expect(result.success).toBe(false);
    });
});

/** Verifica os campos obrigatórios dos bodies de criação e de junction. */
describe('campos obrigatórios', () => {
    /** Nome ausente ou vazio invalida a criação simples. */
    it.each([{}, { nome: '' }])('createMusicaBodySchema recusa nome ausente/vazio: %p', (body) => {
        const result = createMusicaBodySchema.safeParse({ fk_tonalidade: UUID, ...body });
        expect(result.success).toBe(false);
    });

    /** fk_tonalidade é obrigatório e precisa ser UUID na criação simples. */
    it('createMusicaBodySchema recusa fk_tonalidade não-UUID', () => {
        const result = createMusicaBodySchema.safeParse({ nome: 'Oceans', fk_tonalidade: 'abc' });
        expect(result.success).toBe(false);
    });

    /** Body mínimo válido da criação simples é aceito. */
    it('createMusicaBodySchema aceita nome + fk_tonalidade válidos', () => {
        const result = createMusicaBodySchema.safeParse({ nome: 'Oceans', fk_tonalidade: UUID });
        expect(result.success).toBe(true);
    });

    /** Nome é obrigatório também na criação completa. */
    it('createMusicaCompleteBodySchema recusa nome ausente', () => {
        const result = createMusicaCompleteBodySchema.safeParse({});
        expect(result.success).toBe(false);
    });

    /** categoria_id é obrigatório e precisa ser UUID. */
    it.each([{}, { categoria_id: 'abc' }])(
        'addCategoriaBodySchema recusa categoria_id ausente/inválido: %p',
        (body) => {
            const result = addCategoriaBodySchema.safeParse(body);
            expect(result.success).toBe(false);
        },
    );

    /** funcao_id é obrigatório e precisa ser UUID. */
    it.each([{}, { funcao_id: 'abc' }])(
        'addFuncaoBodySchema recusa funcao_id ausente/inválido: %p',
        (body) => {
            const result = addFuncaoBodySchema.safeParse(body);
            expect(result.success).toBe(false);
        },
    );

    /** Arrays de junction só aceitam UUIDs. */
    it('createMusicaCompleteBodySchema recusa categoria_ids com item não-UUID', () => {
        const result = createMusicaCompleteBodySchema.safeParse({
            nome: 'Oceans',
            categoria_ids: [UUID, 'abc'],
        });
        expect(result.success).toBe(false);
    });
});

/** Verifica que os params de rota exigem UUIDs em todas as posições. */
describe('schemas de params', () => {
    /** :id precisa ser UUID. */
    it('musicaIdParamsSchema recusa id não-UUID', () => {
        expect(musicaIdParamsSchema.safeParse({ id: 'abc' }).success).toBe(false);
        expect(musicaIdParamsSchema.safeParse({ id: UUID }).success).toBe(true);
    });

    /** Ambos os params de versão precisam ser UUID. */
    it('musicaVersaoParamsSchema exige UUID em musicaId e versaoId', () => {
        expect(musicaVersaoParamsSchema.safeParse({ musicaId: UUID, versaoId: 'x' }).success).toBe(false);
        expect(musicaVersaoParamsSchema.safeParse({ musicaId: 'x', versaoId: UUID_2 }).success).toBe(false);
        expect(musicaVersaoParamsSchema.safeParse({ musicaId: UUID, versaoId: UUID_2 }).success).toBe(true);
    });

    /** Ambos os params de categoria precisam ser UUID. */
    it('musicaCategoriaParamsSchema exige UUID em musicaId e categoriaId', () => {
        expect(musicaCategoriaParamsSchema.safeParse({ musicaId: UUID, categoriaId: 'x' }).success).toBe(false);
        expect(musicaCategoriaParamsSchema.safeParse({ musicaId: UUID, categoriaId: UUID_2 }).success).toBe(true);
    });

    /** Ambos os params de função precisam ser UUID. */
    it('musicaFuncaoParamsSchema exige UUID em musicaId e funcaoId', () => {
        expect(musicaFuncaoParamsSchema.safeParse({ musicaId: UUID, funcaoId: 'x' }).success).toBe(false);
        expect(musicaFuncaoParamsSchema.safeParse({ musicaId: UUID, funcaoId: UUID_2 }).success).toBe(true);
    });
});
