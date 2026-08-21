const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminChatPage.tsx', 'utf8');

code = code.replace(/onEdit=\{async \(messageId, text\) => \{[\s\S]*?\}\}/, 'onEdit={async (messageId, text) => {\n                                            await editMessage(messageId, text);\n                                        }}');

code = code.replace(/onDelete=\{async \(messageId\) => \{[\s\S]*?\}\}/, 'onDelete={async (messageId) => {\n                                            await deleteMessage(messageId);\n                                        }}');

fs.writeFileSync('src/components/admin/AdminChatPage.tsx', code);
