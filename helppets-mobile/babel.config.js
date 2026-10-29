module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';
  return {
    presets: [
      [
        'babel-preset-expo',
        // Dynatrace: su jsx-runtime envuelve los componentes para auto-instrumentar toques y renders.
        // En tests usamos el runtime normal de React.
        isTest ? {} : { jsxRuntime: 'automatic', jsxImportSource: '@dynatrace/react-native-plugin' },
      ],
    ],
    // Plugin de Babel de Dynatrace: auto-instrumentación en build time (user actions, fetch, lifecycle).
    plugins: isTest ? [] : ['@dynatrace/react-native-plugin/instrumentation/BabelPluginDynatrace'],
  };
};
