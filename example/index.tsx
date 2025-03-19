import { createRoot } from 'react-dom/client';
import ArcoDemo from './ArcoDemo';


const container = document.getElementById('bd');
const root = createRoot(container);
root.render(
  <ArcoDemo />,
);
