// Component data with enhanced descriptions and examples
const componentsData = [
  {
    id: 'llm',
    name: 'LLM Client',
    icon: '🤖',
    x: 50,
    y: 50,
    color: 'var(--llm-color)',
    description: 'Large Language Models like Claude Desktop that act as clients in the protocol.',
    details: 'LLM Clients are the central actors in the Model Context Protocol, consuming resources and tools from servers. They can be desktop applications, plugins, or embedded in other software, enabling LLMs to access external data and functionality securely.',
    endpoints: [
      'Connects to servers via transports',
      'Discovers available resources, prompts and tools',
      'Executes tools and processes sampling requests'
    ],
    examples: [
      'Claude Desktop with the MCP client built-in',
      'Zed editor with integrated LLM capabilities',
      'Sourcegraph Cody for accessing code repositories'
    ]
  },
  {
    id: 'resources',
    name: 'Resources',
    icon: '📚',
    x: 75,
    y: 25,
    color: 'var(--resources-color)',
    description: 'Data exposed by the server, identified by URIs. Can be text or binary content.',
    details: 'Resources represent data that servers make available to LLM clients. They are identified by URIs and can be static (directly available) or dynamic (generated from templates). Resources provide context to LLMs, enabling them to work with external data like files, databases, or API responses.',
    endpoints: [
      'resources/list - List available resources',
      'resources/list_templates - List URI templates',
      'resources/read - Get resource content',
      'resources/subscribe - Watch for changes'
    ],
    examples: [
      'Filesystem resources: `/files/documents/report.md`',
      'Database resources: `/db/users/recent`',
      'Generated resources: `/github/repos/{owner}/{repo}/issues`'
    ]
  },
  {
    id: 'prompts',
    name: 'Prompts',
    icon: '📝',
    x: 25,
    y: 75,
    color: 'var(--prompts-color)',
    description: 'Reusable templates that can include dynamic arguments and resource context.',
    details: 'Prompts are reusable templates exposed by servers that LLMs can use to structure their interactions with resources. They support dynamic arguments and can include content from resources, making them powerful tools for creating consistent and effective LLM interactions.',
    endpoints: [
      'prompts/list - Discover available prompts',
      'prompts/get - Retrieve a prompt with arguments'
    ],
    examples: [
      'Summarization prompt: `summarize({resource}, {max_length})`',
      'Code review prompt: `review_code({resource}, {focus_areas})`',
      'Translation prompt: `translate({resource}, {target_language})`'
    ]
  },
  {
    id: 'tools',
    name: 'Tools',
    icon: '🔧',
    x: 75,
    y: 75,
    color: 'var(--tools-color)',
    description: 'Executable functions that enable LLMs to interact with external systems.',
    details: 'Tools are executable functions exposed by servers that allow LLMs to perform actions beyond their context window. They have a defined schema for inputs and outputs, enabling LLMs to understand how to use them and what to expect in return.',
    endpoints: [
      'tools/list - Discover available tools',
      'tools/call - Execute a tool with arguments'
    ],
    examples: [
      'Web search: `search({query}, {num_results})`',
      'Database query: `query_database({sql_query})`',
      'API interaction: `post_to_api({endpoint}, {payload})`'
    ]
  },
  {
    id: 'sampling',
    name: 'Sampling',
    icon: '🔄',
    x: 25,
    y: 25,
    color: 'var(--sampling-color)',
    description: 'Allows servers to request LLM completions via the client.',
    details: 'Sampling enables a server to request completions from the LLM client, creating a powerful feedback loop. This allows for more complex interactions where servers can process initial LLM outputs and then request refined completions, all while maintaining context.',
    endpoints: [
      'sampling/createMessage - Request LLM completion',
      'sampling/cancelMessage - Cancel a pending request'
    ],
    examples: [
      'Multi-step reasoning: Server requests intermediate steps',
      'Human-in-the-loop: Server requests confirmations before actions',
      'Iterative refinement: Server requests improvements to initial outputs'
    ]
  },
  {
    id: 'transports',
    name: 'Transports',
    icon: '🔌',
    x: 50,
    y: 85,
    color: 'var(--transports-color)',
    description: 'Communication channels between clients and servers using JSON-RPC 2.0.',
    details: 'Transports handle the communication between LLM clients and servers. The protocol supports different transport mechanisms, including stdio for local connections and SSE (Server-Sent Events) over HTTP for remote connections. All transports use JSON-RPC 2.0 for structured message exchange.',
    endpoints: [
      'stdio - Standard I/O for local connections',
      'SSE over HTTP - Remote connections',
      'Custom transports - Implement the Transport interface'
    ],
    examples: [
      'Local plugin using stdio transport',
      'Remote API server using SSE over HTTP',
      'Custom WebSocket implementation for real-time communication'
    ]
  }
];

// Enhanced connections with descriptions
const connectionsData = [
  ['llm', 'resources', 'LLM clients access and read resources'],
  ['llm', 'prompts', 'LLM clients discover and use prompts'],
  ['llm', 'tools', 'LLM clients discover and execute tools'],
  ['llm', 'sampling', 'Servers request completions from LLM clients'],
  ['resources', 'prompts', 'Prompts can include resource content'],
  ['tools', 'prompts', 'Tools can be integrated in prompts'],
  ['sampling', 'tools', 'Sampling can trigger tool execution'],
  ['llm', 'transports', 'LLM clients connect through transports'],
  ['resources', 'tools', 'Tools can operate on resources'],
  ['transports', 'resources', 'Transports enable resource access']
];