import EmberRouter from '@ember/routing/router';
import config from 'use-route-manager/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  // Add route declarations here
  this.route('classic', function () {
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
