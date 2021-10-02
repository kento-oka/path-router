import { makeRouter } from '.';

describe('route options', () => {
  describe('exact', () => {
    const routerBuilder = makeRouter()
      .add('/one', () => 'one')
      .add('/one/two', () => 'two');

    test('not set', () => {
      const router = routerBuilder.build();
      expect(router.match('/one')).toBe('one');
      expect(router.match('/one/two')).toBe('one');
      expect(router.match('/one/not-found')).toBe('one');
    });

    test('false', () => {
      const router = routerBuilder.build({ exact: false });
      expect(router.match('/one')).toBe('one');
      expect(router.match('/one/two')).toBe('one');
      expect(router.match('/one/not-found')).toBe('one');
    });

    test('true', () => {
      const router = routerBuilder.build({ exact: true });
      expect(router.match('/one')).toBe('one');
      expect(router.match('/one/two')).toBe('two');
      expect(router.match('/one/not-found')).toBeNull();
    });
  });

  describe('strict', () => {
    describe('without trailing slash', () => {
      const routerBuilder = makeRouter().add('/one', () => 'one');

      describe('not set', () => {
        test('without exact', () => {
          const router = routerBuilder.build();
          expect(router.match('/one')).toBe('one');
          expect(router.match('/one/')).toBe('one');
        });
        test('with exact', () => {
          const router = routerBuilder.build({ exact: true });
          expect(router.match('/one')).toBe('one');
          expect(router.match('/one/')).toBe('one');
        });
      });
      describe('false', () => {
        test('without exact', () => {
          const router = routerBuilder.build({ strict: false });
          expect(router.match('/one')).toBe('one');
          expect(router.match('/one/')).toBe('one');
        });
        test('with exact', () => {
          const router = routerBuilder.build({ exact: true, strict: false });
          expect(router.match('/one')).toBe('one');
          expect(router.match('/one/')).toBe('one');
        });
      });
      describe('true', () => {
        test('without exact', () => {
          const router = routerBuilder.build({ strict: true });
          expect(router.match('/one')).toBe('one');
          expect(router.match('/one/')).toBe('one');
        });
        test('with exact', () => {
          const router = routerBuilder.build({ exact: true, strict: true });
          expect(router.match('/one')).toBe('one');
          expect(router.match('/one/')).toBeNull();
        });
      });
    });

    describe('with trailing slash', () => {
      const routerBuilder = makeRouter().add('/one/', () => 'one');
      describe('not set', () => {
        test('without exact', () => {
          const router = routerBuilder.build();
          expect(router.match('/one')).toBeNull();
          expect(router.match('/one/')).toBe('one');
        });
        test('with exact', () => {
          const router = routerBuilder.build({ exact: true });
          expect(router.match('/one')).toBeNull();
          expect(router.match('/one/')).toBe('one');
        });
      });
      describe('false', () => {
        test('without exact', () => {
          const router = routerBuilder.build({ strict: false });
          expect(router.match('/one')).toBeNull();
          expect(router.match('/one/')).toBe('one');
        });
        test('with exact', () => {
          const router = routerBuilder.build({ exact: true, strict: false });
          expect(router.match('/one')).toBeNull();
          expect(router.match('/one/')).toBe('one');
        });
      });
      describe('true', () => {
        test('without exact', () => {
          const router = routerBuilder.build({ strict: true });
          expect(router.match('/one')).toBeNull();
          expect(router.match('/one/')).toBe('one');
        });
        test('with exact', () => {
          const router = routerBuilder.build({ exact: true, strict: true });
          expect(router.match('/one')).toBeNull();
          expect(router.match('/one/')).toBe('one');
        });
      });
    });
  });

  describe('sensitive', () => {
    const routerBuilder = makeRouter()
      .add('/one', () => 'lower')
      .add('/One', () => 'upper');

    test('not set', () => {
      const router = routerBuilder.build();
      expect(router.match('/one')).toBe('lower');
      expect(router.match('/One')).toBe('lower');
    });

    test('false', () => {
      const router = routerBuilder.build({ sensitive: false });
      expect(router.match('/one')).toBe('lower');
      expect(router.match('/One')).toBe('lower');
    });

    test('true', () => {
      const router = routerBuilder.build({ sensitive: true });
      expect(router.match('/one')).toBe('lower');
      expect(router.match('/One')).toBe('upper');
    });
  });
});

describe('generic use', () => {
  const makeGenericRouter = () =>
    makeRouter()
      .add('/', () => ({ page: 'top' }))
      .add('/about', () => ({ page: 'about' }))
      .add('/entities', () => ({ page: 'entities' }))
      .add<{ id: string }>('/entities/:id([1-9][0-9]*)', (m) => ({
        page: 'entities',
        id: m.params.id,
      }));
  test('default', () => {
    const router = makeGenericRouter().build();

    expect(router.match('/')).toEqual({ page: 'top' });
    expect(router.match('/about')).toEqual({ page: 'top' });
    expect(router.match('/entities')).toEqual({ page: 'top' });
    expect(router.match('/entities/123')).toEqual({ page: 'top' });
    expect(router.match('/not-found')).toEqual({ page: 'top' });
  });

  test('default with reversed define', () => {
    const router = makeGenericRouter().build();

    expect(router.match('/')).toEqual({ page: 'top' });
    expect(router.match('/about')).toEqual({ page: 'top' });
    expect(router.match('/entities')).toEqual({ page: 'top' });
    expect(router.match('/entities/123')).toEqual({ page: 'top' });
    expect(router.match('/not-found')).toEqual({ page: 'top' });
  });

  test('exact', () => {
    const router = makeGenericRouter().build({ exact: true });

    expect(router.match('/')).toEqual({ page: 'top' });
    expect(router.match('/about')).toEqual({ page: 'about' });
    expect(router.match('/entities')).toEqual({ page: 'entities' });
    expect(router.match('/entities/123')).toEqual({ page: 'entities', id: '123' });
    expect(router.match('/not-found')).toBeNull();
  });
});
