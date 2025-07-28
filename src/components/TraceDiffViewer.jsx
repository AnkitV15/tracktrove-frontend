import React from 'react';
// DiffViewer import removed due to peer dependency conflict with React 19.1.0

function TraceDiffViewer({ beforeDtoJson, afterDtoJson }) {
  let oldJson = '';
  let newJson = '';
  let parsedOldDto = null; // Store parsed objects
  let parsedNewDto = null; // Store parsed objects

  try {
    // Parse JSON strings to pretty-printed strings
    if (beforeDtoJson) {
      parsedOldDto = JSON.parse(beforeDtoJson);
      oldJson = JSON.stringify(parsedOldDto, null, 2); // Pretty-print the parsed object
    }
    if (afterDtoJson) {
      parsedNewDto = JSON.parse(afterDtoJson);
      newJson = JSON.stringify(parsedNewDto, null, 2); // Pretty-print the parsed object
    }
  } catch (e) {
    console.error("Error parsing DTO JSON for diff viewer:", e);
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-md border border-red-300">
        <p className="font-semibold">Error parsing DTO JSON:</p>
        <pre className="mt-2 text-xs overflow-x-auto">{e.message}</pre>
        <p className="text-xs italic mt-2">See console for full details.</p>
      </div>
    );
  }

  // Determine if there's any data to show (check parsed objects, not just strings)
  const hasData = parsedOldDto !== null || parsedNewDto !== null;
  // Determine if there are actual differences between the pretty-printed strings
  const hasActualDifferences = oldJson !== newJson;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg shadow-inner border border-gray-200"> {/* Enhanced main card styling */}
      <h4 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">DTO Changes</h4> {/* Bolder title with underline */}
      {!hasData && (
        <p className="text-gray-500 text-center py-6 italic">No DTO changes recorded for this step.</p>
      )}
      {hasData && (
        <>
          {hasActualDifferences ? (
            // Reverted to simple side-by-side display for compatibility
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Increased gap */}
              <div>
                <h5 className="text-md font-semibold text-gray-700 mb-2">DTO Before:</h5>
                <pre className="bg-gray-800 text-green-300 p-4 rounded-lg text-sm overflow-auto max-h-60 font-mono shadow-md border border-gray-700"> {/* Darker background, syntax-highlighting feel */}
                  {oldJson || '<EMPTY>'} {/* Display <EMPTY> for clarity */}
                </pre>
              </div>
              <div>
                <h5 className="text-md font-semibold text-gray-700 mb-2">DTO After:</h5>
                <pre className="bg-gray-800 text-green-300 p-4 rounded-lg text-sm overflow-auto max-h-60 font-mono shadow-md border border-gray-700"> {/* Darker background, syntax-highlighting feel */}
                  {newJson || '<EMPTY>'} {/* Display <EMPTY> for clarity */}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm"> {/* Styled "no changes" box */}
              <p className="font-medium mb-3">DTO payload is present but no changes detected for this step.</p>
              <div className="mt-4">
                <div>
                  <h5 className="text-md font-medium text-gray-700 mb-2">Current DTO:</h5>
                  <pre className="bg-gray-800 text-green-300 p-4 rounded-lg text-sm overflow-auto max-h-60 font-mono shadow-md border border-gray-700"> {/* Consistent styling */}
                    {/* Display the content if it's not null, otherwise 'N/A' */}
                    {(oldJson || newJson) || '<EMPTY>'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <p className="text-xs text-gray-500 mt-6 italic text-right">
        (Note: `react-diff-viewer` was removed due to React version incompatibility. For a visual diff highlighting changes, consider alternative libraries or a custom implementation compatible with React 19.)
      </p>
    </div>
  );
}

export default TraceDiffViewer;
