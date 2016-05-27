import analyticsInstance from '../analytics/analytics';
import AnalyticsGAPlugin from '../analytics/analytics__ga-plugin';
import AnalyticsCustomPlugin from '../analytics/analytics__custom-plugin';

/**
 * @ngdoc module
 * @name Analytics Ng
 *
 * @example
 * <example name="Analytics">
 *   <file name="index.js" webpack="true">
       require('angular');
       require('ring-ui/components/analytics-ng/analytics-ng');

        angular.module('Example.analyticsDemo', ['Ring.analytics'])
          .config([
            'analyticsProvider',
            'AnalyticsCustomPlugin',
            'AnalyticsGAPlugin',
            function(analyticsProvider, AnalyticsCustomPlugin, AnalyticsGAPlugin) {
              var analyticsEnabled = true;
              if (analyticsEnabled) {
                var isDevelopment = true;
                var customPlugin = new AnalyticsCustomPlugin(function(data) {
                  console.log('Here you can send data to server', data);
                }, isDevelopment, 600);
                var gaId; // = 'GA-XXXXX-ID';
                analyticsProvider.plugins([
                  customPlugin //, new AnalyticsGAPlugin(gaId)
                ]);
              }
            }
          ])

          .controller('TrackEventDemoCtrl', [
            'analytics',
            function(analytics) {
              analytics.trackEvent('track-event-demo', 'show');
            }
          ]);
     </file>
     <file name="index.html">
       <div ng-app="Example.analyticsDemo">
        <a href="" rg-analytics="overview:view-doc">Link-with-on-click-analytic</a>
        <a href="" rg-analytics="overview:view-doc" rg-analytics-on="mouseover">Link-with-on-mouseover-analytic</a>
        <div ng-controller="TrackEventDemoCtrl"></div>
       </div>
     </file>
   </example>
*/
/* global angular: false */
const module = angular.module('Ring.analytics', []);

/**
 * @name analyticsProvider
 * @description configures analytics with plugins
 */
module.provider('analytics', function () {
  let configPlugins = [];
  /**
   * @param plugins
   */
  this.plugins = plugins => {
    configPlugins = plugins;
  };

  /*@ngInject*/
  this.$get = ($log, $injector) => {
    const loadedPlugins = [];
    for (let i = 0; i < configPlugins.length; ++i) {
      if (typeof configPlugins[i] === 'string') {
        try {
          const plugin = $injector.get(configPlugins[i]);
          loadedPlugins.push(plugin);
          $log.debug(`analytics: loaded plugin ${configPlugins[i]}`);
        } catch (err) {
          $log.debug(`analytics: unable to load factory ${configPlugins[i]}`);
        }
      } else {
        loadedPlugins.push(configPlugins[i]);
      }
    }
    analyticsInstance.config(loadedPlugins);
    return analyticsInstance;
  };
});

module.constant('AnalyticsGAPlugin', AnalyticsGAPlugin);
module.constant('AnalyticsCustomPlugin', AnalyticsCustomPlugin);

/**
 * Enable page tracking
 */
module.run(($rootScope, analytics) => {
  $rootScope.$on('$routeChangeSuccess', (evt, current) => { // eslint-disable-line angular/on-watch
    /* eslint-disable angular/no-private-call */
    if (current && current.$$route && current.$$route.originalPath) {
      analytics.trackPageView(current.$$route.originalPath);
    }
    /* eslint-enable angular/no-private-call */
  });
});

/**
 *  @ngdoc directive
 *  @name rg-analytics
 *
 *  @description
 *  The `rg-analytics="<categoryName>:<eventName>"` sends categoryName and eventName to analytics server on
 *  user action, specified via attribute `rg-analytics-on` (e.g. rg-analytics-on='mouseover' means that analytics will be sent on mouseover,
 *  rg-analytics-on='click' - on click). If there is no attribute rg-analytics-on, the default value 'click' is used.
 */
module.directive('rgAnalytics', [
  'analytics',
  analytics => ({
    restrict: 'A',
    replace: false,

    link($scope, elem) {
      const eventType = elem.attr('rg-analytics-on') || 'click';
      angular.element(elem).bind(eventType, () => {
        analytics.track(elem.attr('rg-analytics'));
      });
    }
  })
]);

export default module.name;
