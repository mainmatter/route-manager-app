import EmberRouter from '@ember/routing/router';
import config from 'use-route-manager/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  // EXPERIMENT: every route below is backed by a `.gts` file whose class
  // extends `BaseRoute`, i.e. driven by `PioneerRouteManager`. The implicit
  // `index` routes are declared as files too, so nothing is auto-generated
  // from `route:basic` (which would make it classic).
  this.route('demo', function () {
    this.route('sub');
  });

  this.route('pokemon', function () {
    this.route('pikachu', function () {
      this.route('bulbasaur', function () {
        this.route('charmander', function () {
          this.route('squirtle');
        });
      });
    });
  });

  // Same shape as `pokemon`, but every level awaits its parent's context
  // before fetching (waterfall) instead of fetching first (parallel). Both
  // trees are driven by `PioneerRouteManager`; the name is historical — this
  // family used to be classic `Route`s.
  this.route('classic-pokemon', function () {
    this.route('pikachu', function () {
      this.route('bulbasaur', function () {
        this.route('charmander', function () {
          this.route('squirtle');
        });
      });
    });
  });
});
