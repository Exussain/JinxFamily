import TrackClient from './TrackClient';

export default async function TrackPage(props) {
  const paramsInput = props?.params;
  const params =
    paramsInput && typeof paramsInput.then === 'function'
      ? await paramsInput
      : paramsInput || {};

  const code = params.code || '';

  return <TrackClient code={code} />;
}

