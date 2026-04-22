import Route from '@ember/routing/route';

export default class ThingRoute extends Route {
  async model() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      name: 'Thing',
    };
  }
}
