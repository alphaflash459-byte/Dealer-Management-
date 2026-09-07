const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const hookCode = `
function useSpatialNavigation() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT') return;
      
      const input = target;

      // Prevent default ArrowUp/ArrowDown on number inputs to avoid changing the value
      if (input.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
      }

      // We handle ArrowLeft and ArrowRight as well.
      // Many users want Left/Right to jump between columns in a grid when typing numbers.
      // If the input is type="number", we can't get cursor position, so let's just allow jumping 
      // with Left/Right. If they want to move cursor, they can use mouse.
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (input.type === 'number' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            e.preventDefault();
        } else if (input.type !== 'number' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && input.tagName === 'INPUT') {
            // For text inputs, let them move the cursor
            return;
        }

        const inputs = Array.from(
          document.querySelectorAll('input:not([disabled]):not([readonly]):not([type="hidden"]), select:not([disabled])')
        ).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        const currentIndex = inputs.indexOf(input);
        if (currentIndex === -1) return;

        let nextInput = null;
        const currentRect = input.getBoundingClientRect();

        if (e.key === 'ArrowDown') {
          let minDistance = Infinity;
          for (let i = currentIndex + 1; i < inputs.length; i++) {
            const rect = inputs[i].getBoundingClientRect();
            if (rect.top >= currentRect.bottom - 8) {
              const overlapX = Math.min(currentRect.right, rect.right) - Math.max(currentRect.left, rect.left);
              const isVerticallyAligned = overlapX > 0 || Math.abs(rect.left - currentRect.left) < 50;
              if (isVerticallyAligned) {
                 const distance = rect.top - currentRect.bottom;
                 if (distance < minDistance) {
                     minDistance = distance;
                     nextInput = inputs[i];
                 }
              }
            }
          }
        } else if (e.key === 'ArrowUp') {
          let minDistance = Infinity;
          for (let i = currentIndex - 1; i >= 0; i--) {
            const rect = inputs[i].getBoundingClientRect();
            if (rect.bottom <= currentRect.top + 8) {
              const overlapX = Math.min(currentRect.right, rect.right) - Math.max(currentRect.left, rect.left);
              const isVerticallyAligned = overlapX > 0 || Math.abs(rect.left - currentRect.left) < 50;
              if (isVerticallyAligned) {
                 const distance = currentRect.top - rect.bottom;
                 if (distance < minDistance) {
                     minDistance = distance;
                     nextInput = inputs[i];
                 }
              }
            }
          }
        } else if (e.key === 'ArrowRight') {
           nextInput = inputs[currentIndex + 1];
        } else if (e.key === 'ArrowLeft') {
           nextInput = inputs[currentIndex - 1];
        }

        if (nextInput) {
          nextInput.focus();
          if (nextInput.tagName === 'INPUT') {
            nextInput.select();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

export default function App() {`;

content = content.replace('export default function App() {', hookCode);

content = content.replace('  const [currentUser, setCurrentUser] = useState<User | null>(null);', '  useSpatialNavigation();\n  const [currentUser, setCurrentUser] = useState<User | null>(null);');

fs.writeFileSync('src/App.tsx', content);
