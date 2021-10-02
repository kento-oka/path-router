import { pathToRegexp, Key } from 'path-to-regexp';

export interface PathOption {
  exact?: boolean;
  strict?: boolean;
  sensitive?: boolean;
}

export interface Match<T = { [key: string]: string }> {
  pathname: string;
  path: string;
  params: T;
}

export class RouterBuilder<Result> {
  private paths: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resultGenerators: { [path: string]: (match: Match<any>) => Result } = {};
  private pathOptions: { [path: string]: PathOption | null } = {};

  public add<Params>(
    path: string,
    resultGenerator: (match: Match<Params>) => Result,
    option?: PathOption
  ): this {
    if (!this.resultGenerators[path]) {
      this.paths.push(path);
    }

    this.resultGenerators[path] = resultGenerator;
    this.pathOptions[path] = option ?? null;

    return this;
  }

  /* TODO: groupOptionが必要かとかほかにグルーピングできるものがないかとか
  private pathPrefixes: string[] = [];
  private groupOptions: (PathOption | undefined)[] = [];

  public group(callback: (builder: this) => void): this {
    return this;
  }
  */

  public build(defaultPathOption: PathOption = {}): Router<Result> {
    return new Router<Result>(
      [...this.paths],
      { ...this.resultGenerators },
      { ...this.pathOptions },
      {
        exact: false,
        strict: false,
        sensitive: false,
        ...defaultPathOption,
      }
    );
  }
}

export class Router<Result> {
  private matchResultCaches: {
    [pathname: string]: Result | null | undefined;
  } = {};
  private pathRegexps: { [path: string]: RegExp } = {};
  private pathKeys: { [path: string]: Key[] } = {};

  constructor(
    private paths: readonly string[],
    private resultGenerators: { [path: string]: (match: Match) => Result },
    private pathOptions: { [path: string]: PathOption | null },
    private defaultPathOption: Required<PathOption>
  ) {
    for (const path of this.paths) {
      if (path.slice(0, 1) !== '/') {
        throw new Error('TODO error message');
      }

      for (const prop of ['resultGenerators', 'pathOptions'] as const) {
        if (this[prop][path] === undefined) {
          throw new Error(`${prop}[${path}] is not defined.`);
        }
      }
    }
  }

  private compile(path: string, option: Required<PathOption>): [RegExp, Key[]] {
    if (this.pathRegexps[path] && this.pathKeys[path]) {
      return [this.pathRegexps[path], this.pathKeys[path]];
    }

    const keys: Key[] = [];
    this.pathRegexps[path] = pathToRegexp(path, keys, {
      end: option.exact,
      strict: option.strict,
      sensitive: option.sensitive,
    });
    this.pathKeys[path] = keys;

    return [this.pathRegexps[path], this.pathKeys[path]];
  }

  public match(pathname: string, matchFlag: number | null = null): Result | null {
    if ((matchFlag ?? 0) < 0) {
      throw new Error('TODO error message');
    }
    const cachedResult = this.matchResultCaches?.[pathname];
    if (cachedResult !== undefined) {
      return cachedResult;
    }

    for (const path of this.paths) {
      const pathOption = { ...this.defaultPathOption, ...(this.pathOptions[path] ?? {}) };

      const [regexp, keys] = this.compile(path, pathOption);
      const match = regexp.exec(pathname);

      if (match) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [matchPath, ...values] = match;
        const result = this.resultGenerators[path]({
          pathname,
          path,
          params: keys.reduce((params, key, i) => ({ ...params, [key.name]: values[i] }), {}),
        });
        this.matchResultCaches[pathname] = result;
        return result;
      }
    }

    this.matchResultCaches[pathname] = null;
    return null;
  }
}

export function makeRouter<Result>(): RouterBuilder<Result> {
  return new RouterBuilder();
}
