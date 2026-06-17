import React, { useState, useEffect } from 'react';
import { BlockTable } from '../components/BlockTable';
import * as api from '../services/api';

export function Blocks({ wsBlocks }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadInitialBlocks = async () => {
    setLoading(true);
    try {
      const data = await api.getBlocks();
      if (data.success) {
        setBlocks(data.blocks);
        if (data.blocks.length < 20) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialBlocks();
  }, []);

  // Sync new blocks from WebSocket
  useEffect(() => {
    if (wsBlocks.length > 0) {
      const newestWsBlock = wsBlocks[0];
      setBlocks((prev) => {
        // Prevent duplication if the block already exists
        if (prev.some(b => b.number === newestWsBlock.number)) {
          return prev;
        }
        return [newestWsBlock, ...prev];
      });
    }
  }, [wsBlocks]);

  const handleLoadMore = async () => {
    if (blocks.length === 0) return;
    setLoading(true);
    const lastBlockNumber = blocks[blocks.length - 1].number;
    
    try {
      const data = await api.getBlocks(lastBlockNumber - 1, 20);
      if (data.success) {
        if (data.blocks.length === 0) {
          setHasMore(false);
        } else {
          setBlocks((prev) => [...prev, ...data.blocks]);
          if (data.blocks.length < 20) {
            setHasMore(false);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Blok Detayları</h2>
      </div>

      {loading && blocks.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Yükleniyor...
        </div>
      ) : (
        <BlockTable 
          blocks={blocks} 
          onLoadMore={handleLoadMore} 
          hasMore={hasMore} 
        />
      )}
    </div>
  );
}
