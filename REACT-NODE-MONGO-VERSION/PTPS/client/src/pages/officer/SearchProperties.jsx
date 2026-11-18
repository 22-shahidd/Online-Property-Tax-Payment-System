import { useState, useRef, useEffect } from "react";
import Panel from "../../components/Panel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { Search } from "lucide-react";

// Search Properties page - live search using React state and useRef for focus
export default function SearchProperties() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // useRef to focus the search input on page load
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current && searchRef.current.focus();
  }, []);

  // Fetch search results whenever the query changes
  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    // Small debounce so we don't fire on every keystroke
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/officer/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Property Search</p>
          <h1>Search Properties</h1>
          <p>Search by tenement number or owner name across all properties.</p>
        </div>
      </div>

      <Panel title="Search" eyebrow="Live search">
        <div className="search-box" style={{ maxWidth: "500px" }}>
          <Search size={17} />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder="Type tenement number or owner name..."
          />
        </div>
      </Panel>

      <Panel title="Search Results" eyebrow={searched ? `${results.length} matches` : "Start typing to search"}>
        {loading ? (
          <LoadingState />
        ) : !searched ? (
          <div className="empty-state">
            <p>Start typing above to search for properties.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <p>No properties found matching "{query}". Try a different search term.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tenement Number</th>
                  <th>Owner</th>
                  <th>Ward</th>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Area</th>
                  <th>Year</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((p) => (
                  <tr key={p._id}>
                    <td><b>{p.tenementNumber}</b></td>
                    <td>{p.ownerName}</td>
                    <td>{p.ward}</td>
                    <td>{p.address}</td>
                    <td style={{ textTransform: "capitalize" }}>{p.propertyType}</td>
                    <td>{p.area.toLocaleString()} sq ft</td>
                    <td>{p.constructionYear}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
