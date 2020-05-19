import { observable, h } from 'sinuous';
import { map } from 'sinuous/map';
import type { Observable } from 'sinuous/observable/src';

import { Loom } from './loom';

const HelloMessage = ({ name }: { name: string }) => (
  <span>Hey {name}</span>
);

// This can't be a document fragment, it needs to be mountable
const messages: Observable<string[]> = observable([]);

const NavBar = ({ items }: { items: string[] }) =>
  <div className="flex mb-2 border-t border-r border-l text-sm rounded">
    {items.map(text =>
      <a
        className="flex-1 text-center px-4 py-2 border-b-2 bg-white hover:bg-gray-100 hover:border-purple-500"
        onClick={() => messages([...messages(), text])}
      >
        {text}
      </a>
    )}
  </div>;

const Page = () =>
  <main className="bg-purple-100 antialiased justify-center p-8">
    <NavBar items={['Edit', 'Run']} />
    <Loom width={20} height={30}/>
    <div>
      {() => {
        const msg = [...messages()];
        const { length } = msg;
        if (length === 0) {
          return;
        }
        let sentence = '';
        if (length <= 2) {
          sentence = `${length} ${msg.join(', ')}`;
        } else {
          const end = msg.pop();
          sentence = `${length} ${msg.join(', ')}, and ${end}`;
        }
        return <HelloMessage name={sentence} />;
      }}
    </div>
    <div>
      {map(messages, item => <p>{item}</p>)}
    </div>
  </main>;

const { body } = document;
body.insertBefore(Page(), body.firstChild);
