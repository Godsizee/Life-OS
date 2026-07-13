from mcp.server.fastmcp import FastMCP

mcp = FastMCP("test-minimal")

@mcp.tool()
def ping() -> str:
    """Einfacher Testtool, gibt 'pong' zurueck."""
    return "pong"

if __name__ == "__main__":
    mcp.run()