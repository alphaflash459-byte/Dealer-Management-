const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        if (e.key === 'ArrowDown') {
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
                     nextInput = inputs[i] as HTMLInputElement | HTMLSelectElement;
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
                     nextInput = inputs[i] as HTMLInputElement | HTMLSelectElement;
                 }
              }
            }
          }
        }`;

const replace = `        if (e.key === 'ArrowDown') {
          let bestCandidate = null;
          let minScore = Infinity;
          for (let i = currentIndex + 1; i < inputs.length; i++) {
            const rect = inputs[i].getBoundingClientRect();
            if (rect.top >= currentRect.bottom - 8) {
              const overlapX = Math.min(currentRect.right, rect.right) - Math.max(currentRect.left, rect.left);
              const dx = Math.abs(rect.left - currentRect.left);
              
              if (overlapX > 0 || dx < 50) {
                 const dy = rect.top - currentRect.bottom;
                 // Score heavily weights Y distance, but uses X distance as a tie-breaker
                 const score = dy * 1000 + dx;
                 if (score < minScore) {
                     minScore = score;
                     bestCandidate = inputs[i];
                 }
              }
            }
          }
          nextInput = bestCandidate as HTMLInputElement | HTMLSelectElement | null;
        } else if (e.key === 'ArrowUp') {
          let bestCandidate = null;
          let minScore = Infinity;
          for (let i = currentIndex - 1; i >= 0; i--) {
            const rect = inputs[i].getBoundingClientRect();
            if (rect.bottom <= currentRect.top + 8) {
              const overlapX = Math.min(currentRect.right, rect.right) - Math.max(currentRect.left, rect.left);
              const dx = Math.abs(rect.left - currentRect.left);
              
              if (overlapX > 0 || dx < 50) {
                 const dy = currentRect.top - rect.bottom;
                 const score = dy * 1000 + dx;
                 if (score < minScore) {
                     minScore = score;
                     bestCandidate = inputs[i];
                 }
              }
            }
          }
          nextInput = bestCandidate as HTMLInputElement | HTMLSelectElement | null;
        }`;

content = content.replace(target, replace);
fs.writeFileSync('src/App.tsx', content);
