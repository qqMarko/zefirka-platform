import React from 'react';
import { X, Send, Trash2, Paperclip, Loader, Mic } from 'lucide-react';

const ChatInputBox = ({ chatInput, handleInputChange, handleSend, mediaPreview, clearMedia, fileInputRef, handleFileSelect, isRecording, recordingTime, formatTime, handleMicClick, cancelRecording, stopRecordingAndSend, isUploading, accent, t, currentLang }) => {
    
    return (
        <>
            {mediaPreview && (
                <div style={{ background: '#111', padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: `2px solid ${accent}` }}>
                        {mediaPreview.type === 'image' ? <img src={mediaPreview.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <video src={mediaPreview.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <div onClick={clearMedia} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}><X size={14} color="white"/></div>
                    </div>
                    <div style={{ color: '#aaa', fontSize: '13px' }}>{mediaPreview.type === 'image' ? 'Фото готове до відправки' : 'Відео готове до відправки'}</div>
                </div>
            )}

            {isRecording ? (
                <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0f', display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 }}>
                    <div onClick={cancelRecording} style={{ cursor: 'pointer', color: '#ff4444', padding: '10px', background: 'rgba(255,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }} className="menu-hover">
                        <Trash2 size={20} />
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '25px' }}>
                        <div className="pulse-record" style={{ width: '12px', height: '12px', background: '#ff4444', borderRadius: '50%' }}></div>
                        <span style={{ color: 'white', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px', letterSpacing: '1px' }}>{formatTime(recordingTime)}</span>
                    </div>

                    <div onClick={stopRecordingAndSend} style={{ width: '50px', height: '50px', background: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.3s', flexShrink: 0, boxShadow: '0 0 15px rgba(76, 175, 80, 0.3)' }} className="menu-hover">
                        <Send size={20} color="white" style={{ marginLeft: '-2px' }} />
                    </div>
                </div>
            ) : (
                <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0f', display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 }}>
                    <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                    <div onClick={() => fileInputRef.current.click()} style={{ padding: '10px', cursor: 'pointer', background: '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', transition: '0.3s', flexShrink: 0 }} className="menu-hover">
                        <Paperclip size={20} />
                    </div>

                    <input 
                        value={chatInput} onChange={handleInputChange} onKeyPress={e => e.key === 'Enter' && handleSend()} 
                        placeholder={t[currentLang]?.typeMessage || 'Введіть повідомлення...'} 
                        style={{ flex: 1, background: '#111', border: '1px solid rgba(255,255,255,0.1)', padding: '15px 20px', color: 'white', borderRadius: '25px', outline: 'none', fontSize: '14px', fontFamily: 'inherit', fontWeight: '500', minWidth: 0 }} 
                        disabled={isUploading}
                    />
                    
                    <div onClick={(chatInput.trim() || mediaPreview) ? handleSend : handleMicClick} style={{ width: '50px', height: '50px', background: (chatInput.trim() || mediaPreview) ? accent : '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: !isUploading ? 'pointer' : 'default', transition: '0.3s', flexShrink: 0 }} className={!isUploading ? "menu-hover" : ""}>
                        {isUploading ? <Loader size={20} color="white" className="spin" /> : 
                            (chatInput.trim() || mediaPreview) ? <Send size={20} color="white" style={{ marginLeft: '-2px' }} /> : <Mic size={20} color="#888" />}
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatInputBox;