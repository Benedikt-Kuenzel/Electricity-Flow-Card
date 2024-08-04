import { ElectricityEntity } from "./ElectricityEntity";


export class ElectricityEdge {

    private From: ElectricityEntity;
    private To: ElectricityEntity;
    private sourceHandle: string;
    private targetHandle: string;
    private flowBeginSeconds: number;

    constructor(From: ElectricityEntity, To: ElectricityEntity, sourceHandle: string, targetHandle: string, flowBeginSeconds: number) {
        this.From = From;
        this.To = To;
        this.sourceHandle = sourceHandle;
        this.targetHandle = targetHandle;
        this.flowBeginSeconds = flowBeginSeconds;
    }

    public getEdgeDescription() {
        var nodeType = this.To.getNodeTypeDescription();
        var flowRate = ElectricityEntity.getElectricityFlowRate(this.From, this.To);
        var color = nodeType.isSubHome ? ElectricityEntity.getInboundColor(this.To) : ElectricityEntity.getInboundColor(this.From);

        return {
            id: this.From.getNodeId() + '-' + this.To.getNodeId(),
            data: {
                animationSpeed: String(Math.round((1 / flowRate) * 10) / 10) + "s",
                dotColor: color,
                lineColor: color,
                begin: this.flowBeginSeconds,
            },
            type: 'flowEdge',
            animated: true,
            source: this.From.getNodeId(),
            target: this.To.getNodeId(),
            sourceHandle: this.sourceHandle,
            targetHandle: this.targetHandle
        };
    }
}