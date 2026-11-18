import { useState } from 'react';
import { DEFAULT_SESSION_CONFIG, type SessionConfig } from '../table/session';
import { GameConfigScreen } from './config/GameConfigScreen';
import { HomeScreen } from './home/HomeScreen';
import { TableScreen } from './table/TableScreen';

/** In-app screens (A-1); changes add no history entries and store nothing (A-2). */
type Screen =
  | { readonly name: 'home'; readonly returned: boolean }
  | { readonly name: 'config' }
  | { readonly name: 'table'; readonly config: SessionConfig };

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>({ name: 'home', returned: false });
  switch (screen.name) {
    case 'home':
      return (
        <HomeScreen
          focusHeading={screen.returned}
          onNewGame={() => setScreen({ name: 'config' })}
        />
      );
    case 'config':
      return (
        <GameConfigScreen
          config={DEFAULT_SESSION_CONFIG}
          onCancel={() => setScreen({ name: 'home', returned: true })}
          onStart={(config) => setScreen({ name: 'table', config })}
        />
      );
    case 'table':
      return <TableScreen config={screen.config} />;
  }
}
