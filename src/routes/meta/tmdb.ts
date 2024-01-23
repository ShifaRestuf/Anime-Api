import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { META, PROVIDERS_LIST } from '@consumet/extensions';
import { tmdbApi } from '../../main';
const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  fastify.get('/', (_, rp) => {
    rp.status(200).send({
      intro:
        "Welcome to the tmdb provider: check out the provider's website @ https://www.themoviedb.org/",
      routes: ['/:query', '/info/:id', '/watch/:episodeId'],
      documentation: 'https://docs.consumet.org/#tag/tmdb',
    });
  });

  fastify.get('/:query', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = (request.params as { query: string }).query;
    const page = (request.query as { page: number }).page;
    const tmdb = new META.TMDB(tmdbApi);

    const res = await tmdb.search(query, page);

    reply.status(200).send(res);
  });

  fastify.get('/info/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const id = (request.params as { id: string }).id;
    const type = (request.query as { type: string }).type;
    const provider = (request.query as { provider?: string }).provider;
    let tmdb = new META.TMDB(tmdbApi);

    if (!type) return reply.status(400).send({ message: "The 'type' query is required" });

    if (typeof provider !== 'undefined') {
      const possibleProvider = PROVIDERS_LIST.MOVIES.find(
        (p) => p.name.toLowerCase() === provider.toLocaleLowerCase(),
      );
      tmdb = new META.TMDB(tmdbApi, possibleProvider);
    }

    const res = await tmdb.fetchMediaInfo(id, type);
    reply.status(200).send(res);
  });

  fastify.get(
    '/watch/:episodeId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const episodeId = (request.params as { episodeId: string }).episodeId;
      const id = (request.query as { id: string }).id;
      const provider = (request.query as { provider?: string }).provider;

      let tmdb = new META.TMDB(tmdbApi);
      if (typeof provider !== 'undefined') {
        const possibleProvider = PROVIDERS_LIST.MOVIES.find(
          (p) => p.name.toLowerCase() === provider.toLocaleLowerCase(),
        );
        tmdb = new META.TMDB(tmdbApi, possibleProvider);
      }
      try {
        const res = await tmdb
          .fetchEpisodeSources(episodeId, id)
          .catch((err) => reply.status(404).send({ message: err }));

        reply.status(200).send(res);
      } catch (err) {
        reply
          .status(500)
          .send({ message: 'Something went wrong. Contact developer for help.' });
      }
    },
  );
};

export default routes;
